from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from chameleon_engine import ChameleonDefense
import uvicorn

app = FastAPI(title="Chameleon Active Defense API", version="1.0")

print(">>> Initializing Defense Engine...")
# Ensure 'chameleon_brain.pkl' is in the same folder
defense_system = ChameleonDefense('chameleon_brain.pkl')

class PayloadRequest(BaseModel):
    payload: str
    ip_address: str = "127.0.0.1" 

@app.post("/analyze")
async def analyze_payload(request: PayloadRequest):
    """
    Analyze a payload for SQLi or XSS.
    """
    # 1. Check if model loaded (optional, handled by engine safety now)
    if not defense_system.model and not defense_system.reflex:
         raise HTTPException(status_code=503, detail="Defense System Unavailable")

    # 2. Call the engine (Returns a SINGLE dictionary now)
    result = defense_system.analyze_request(request.payload, request.ip_address)
    
    # 3. Construct Response
    # We extract data from the 'result' dictionary
    return {
        "status": result.get('status', 200),
        "message": result.get('msg', "Processed"),
        "analysis": {
            "verdict": result.get('classification', "Unknown"), 
            "confidence": result.get('confidence', 0.0),
            "detected_by": result.get('detection_source', "System"),
            # Include the SHAP explanation if available
            "xai_explanation": result.get('xai_explanation', None)
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)