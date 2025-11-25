import shap
import numpy as np
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chameleon_xai")

class ChameleonXAI:
    def __init__(self, model, encoder):
        self.model = model
        self.classes = encoder.classes_
        self.explainer = None
        self.mode = "proba" # Default to probability mode

        try:
            # 1. Determine which prediction function exists
            # If predict_proba exists, use it (Best for SHAP)
            if hasattr(model, "predict_proba"):
                self.pred_fn = model.predict_proba
                self.mode = "proba"
            # If not, fall back to decision_function (Common for SVMs/Linear models)
            elif hasattr(model, "decision_function"):
                self.pred_fn = model.decision_function
                self.mode = "margin"
            else:
                raise AttributeError("Model has neither predict_proba nor decision_function")

            # 2. Define the Wrapper
            # SHAP needs a function that accepts a list/array of text
            def f(x):
                return self.pred_fn(x)

            # 3. Initialize Explainer with Text Masker
            masker = shap.maskers.Text(tokenizer=r"\W+")
            self.explainer = shap.Explainer(f, masker)
            
            logger.info(f"XAI Engine (SHAP): Initialized in {self.mode} mode.")

        except Exception as e:
            logger.warning(f"XAI Init Failed: {e}")

    def explain(self, text):
        if not self.explainer:
            return None

        try:
            # 1. Calculate SHAP values
            shap_values = self.explainer([text], max_evals=100)

            # 2. Determine Target Class
            # We need to know which class the model chose so we can explain THAT choice.
            if self.mode == "proba":
                probs = self.model.predict_proba([text])[0]
                pred_index = np.argmax(probs)
            else:
                # For decision_function, usually >0 is Class 1, <0 is Class 0 (Binary)
                scores = self.model.decision_function([text])
                # Handle binary vs multi-class decision function shapes
                if scores.ndim == 1 or scores.shape[1] == 1:
                    pred_index = 1 if scores[0] > 0 else 0
                else:
                    pred_index = np.argmax(scores[0])
            
            target_class = self.classes[pred_index]

            # 3. Extract Values based on Mode
            # SHAP structure differs slightly depending on the output shape of the function
            if self.mode == "margin" and (len(shap_values.values.shape) == 2):
                # Binary margin case: SHAP returns (1, tokens)
                token_values = shap_values.values[0]
                # If we predicted class 0 (Benign), we might need to invert scores if SHAP explained Class 1
                if pred_index == 0:
                    token_values = -token_values
            else:
                # Standard case: SHAP returns (1, tokens, classes)
                token_values = shap_values.values[0, :, pred_index]

            token_names = shap_values.data[0]

            # 4. Format Output
            explanation_data = []
            for word, score in zip(token_names, token_values):
                if word.strip() and abs(score) > 0.01:
                    explanation_data.append({
                        "feature": word.strip(),
                        "impact": float(f"{score:.4f}"),
                        "type": "RISK_FACTOR" if score > 0 else "MITIGATING_FACTOR"
                    })
            
            explanation_data.sort(key=lambda x: abs(x['impact']), reverse=True)

            return {
                "target_class": target_class,
                "contributors": explanation_data
            }

        except Exception as e:
            logger.error(f"SHAP Explanation Error: {e}")
            return None