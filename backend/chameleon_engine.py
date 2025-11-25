import re
import pickle
import time
import json
import hashlib
import urllib.parse
from datetime import datetime
from chameleon_xai import ChameleonXAI

class HeuristicReflex:
    def __init__(self):
        self.sqli_patterns = [
            re.compile(r'(?i)\bunion\s+select\b'),
            re.compile(r'(?i)\bselect\s+\*\s+from\b'),
            re.compile(r'(?i)\bwaitfor\s+delay\b'),
            re.compile(r"(?i)'\s*or\s*'?1'?='?1"),
            re.compile(r'(?i)--'),
            re.compile(r'(?i)\/\*.*\*\/')
        ]
        
        self.xss_patterns = [
            re.compile(r'(?i)<script.*?>'),
            re.compile(r'(?i)javascript:'),
            re.compile(r'(?i)on\w+\s*='),
            re.compile(r'(?i)alert\s*\('),
            re.compile(r'(?i)document\.cookie')
        ]

    def scan(self, payload):
        for pattern in self.sqli_patterns:
            if pattern.search(payload):
                return "SQLi", 1.0
        
        for pattern in self.xss_patterns:
            if pattern.search(payload):
                return "XSS", 1.0
                
        return None, 0.0

class ChameleonDefense:
    def __init__(self, model_path='chameleon_brain.pkl'):
        self.reflex = HeuristicReflex()
        self.ip_tracker = {} 
        self.evidence_chain = []
        self.previous_hash = "0" * 64
        self.model = None
        self.encoder = None
        self.xai = None

        try:
            with open(model_path, 'rb') as f:
                bundle = pickle.load(f)
                self.model = bundle['pipeline']
                self.encoder = bundle['encoder']
                self.xai = ChameleonXAI(self.model, self.encoder)
        except FileNotFoundError:
            print(f"Error: '{model_path}' not found.")

    def preprocess(self, text):
        try:
            text = urllib.parse.unquote(text)
        except:
            pass
        return str(text).lower().strip()

    def tarpit_logic(self, ip):
        now = time.time()
        if ip not in self.ip_tracker:
            self.ip_tracker[ip] = []
            
        self.ip_tracker[ip] = [t for t in self.ip_tracker[ip] if now - t < 60]
        self.ip_tracker[ip].append(now)
        
        count = len(self.ip_tracker[ip])
        
        if count > 5:
            return min((count - 5) * 1.5, 10)
        return 0

    def analyze_request(self, raw_payload, ip_address):
        clean_payload = self.preprocess(raw_payload)
        
        attack_type, confidence = self.reflex.scan(clean_payload)
        source = "Heuristic (Reflex)"
        explanation = None
        
        if attack_type is None:
            if self.model:
                pred_label = self.model.predict([clean_payload])[0]
                attack_type = self.encoder.inverse_transform([pred_label])[0]
                
                if hasattr(self.model.named_steps['clf'], 'predict_proba'):
                    probs = self.model.predict_proba([clean_payload])[0]
                    confidence = max(probs)
                else:
                    confidence = 0.95 
                source = "Chameleon Model (Cortex)"

                if attack_type != "Benign" and self.xai:
                    explanation = self.xai.explain(clean_payload)
            else:
                attack_type = "Benign"
                confidence = 0.0

        delay = 0
        if attack_type in ['SQLi', 'XSS']:
            delay = self.tarpit_logic(ip_address)
            if delay > 0:
                time.sleep(delay)

        response = {}
        if attack_type == 'Benign':
            response = {"status": 200, "msg": "Login Failed: Invalid credentials."}
        elif attack_type == 'SQLi':
            response = {
                "status": 500, 
                "msg": f"ERROR 1064 (42000): You have an error in your SQL syntax near '{raw_payload}' at line 1"
            }
        elif attack_type == 'XSS':
            response = {"status": 403, "msg": "Forbidden: Input validation failed."}

        response['classification'] = attack_type
        response['confidence'] = float(confidence)
        response['detection_source'] = source
        response['xai_explanation'] = explanation
        
        return response