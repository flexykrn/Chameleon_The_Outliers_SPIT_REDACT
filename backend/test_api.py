from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from chameleon_engine import ChameleonDefense
import uvicorn
import json
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Chameleon Active Defense API", version="1.0")

LOGS_DIR = Path("security_logs")
LOGS_DIR.mkdir(exist_ok=True)

print("Initializing Defense Engine...")
defense_system = ChameleonDefense('chameleon_brain.pkl')

def save_security_log(log_entry: dict):
    try:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        log_file = LOGS_DIR / f"logs_{date_str}.jsonl"
        
        # Write as JSON Lines (one JSON per line)
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
            
        print(f"Log saved: {log_entry.get('event_id', 'unknown')}")
    except Exception as e:
        print(f"Failed to save log: {e}")

class PayloadRequest(BaseModel):
    payload: str
    ip_address: str = "127.0.0.1" 

@app.post("/analyze")
async def analyze_payload(request: PayloadRequest, req: Request):
    if not defense_system.model and not defense_system.reflex:
         raise HTTPException(status_code=503, detail="Defense System Unavailable")

    result = defense_system.analyze_request(request.payload, request.ip_address)
    
    response_data = {
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
    
    timestamp = datetime.utcnow()
    log_entry = {
        "event_id": f"evt_{int(timestamp.timestamp() * 1000000)}",
        "timestamp": timestamp.isoformat() + "Z",
        "status_code": result.get('status', 200),
        "status_message": result.get('msg', "Processed"),
        "client": {
            "ip": request.ip_address,
            "user_agent": req.headers.get("user-agent", "unknown"),
            "origin": req.headers.get("origin", "unknown")
        },
        "http_context": {
            "endpoint": str(req.url.path),
            "method": req.method,
            "payload_body": request.payload
        },
        "security_analysis": {
            "verdict": result.get('classification', "Unknown"),
            "confidence_score": result.get('confidence', 0.0),
            "detected_by": result.get('detection_source', "System"),
            "xai_explanation": result.get('xai_explanation')
        }
    }
    
    save_security_log(log_entry)
    return response_data

@app.get("/health")
def health_check():
    log_files = list(LOGS_DIR.glob("*.jsonl"))
    total_logs = 0
    
    for log_file in log_files:
        with open(log_file, 'r') as f:
            total_logs += sum(1 for _ in f)
    
    return {
        "status": "active",
        "engine": "loaded" if defense_system.model or defense_system.reflex else "unavailable",
        "logs_dir": str(LOGS_DIR.absolute()),
        "log_files": len(log_files),
        "total_logs": total_logs
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)