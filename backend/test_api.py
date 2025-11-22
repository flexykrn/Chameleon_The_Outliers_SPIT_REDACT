
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from chameleon_engine import ChameleonDefense
import uvicorn


app = FastAPI(title="Chameleon Active Defense API", version="1.0")

print(">>> Initializing Defense Engine...")

defense_system = ChameleonDefense('chameleon_brain.pkl')


class PayloadRequest(BaseModel):
    payload: str
    ip_address: str = "127.0.0.1" 


@app.post("/analyze")
async def analyze_payload(request: PayloadRequest):
    """
    Analyze a payload for SQLi or XSS.
    Returns the verdict, confidence, and the active defense response.
    """
    if not defense_system.model:
        raise HTTPException(status_code=503, detail="AI Model not loaded. Check server logs.")

    
    fake_response, log_entry = defense_system.analyze_request(request.payload, request.ip_address)
    
  
    return {
        "analysis": {
            "verdict": log_entry['classification'], 
            "confidence": log_entry['confidence'],
            "detected_by": log_entry['detection_source'] 
        },
        "defense_action": {
            "status_code": fake_response['status'],
            "message": fake_response['msg'],
            "tarpit_applied": log_entry['tarpit_delay'] 
        },
        "forensics": {
            "merkle_hash": log_entry['merkle_hash'], 
            "timestamp": log_entry['timestamp']
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)