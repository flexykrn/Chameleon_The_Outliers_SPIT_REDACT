import logging
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from chameleon_engine import ChameleonDefense
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chameleon_api")

class XAIContributor(BaseModel):
    feature: str
    impact: float
    type: str

class XAIExplanation(BaseModel):
    target_class: str
    contributors: List[XAIContributor]

class InspectionRequest(BaseModel):
    payload: str = Field(..., min_length=1)

class AnalysisDetails(BaseModel):
    verdict: str
    confidence: float
    detected_by: str
    xai_explanation: Optional[XAIExplanation] = None

class InspectionResponse(BaseModel):
    status: int
    message: str
    client_ip: str
    timestamp: str
    endpoint: str              # NEW
    http_method: str           # NEW
    payload: str               # NEW (incoming request payload)
    analysis: AnalysisDetails

ml_defense: ChameleonDefense = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ml_defense
    try:
        ml_defense = ChameleonDefense(model_path='chameleon_brain.pkl')
        logger.info("Chameleon System: ONLINE")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise e
    yield
    ml_defense = None

app = FastAPI(title="Chameleon Defense WAF", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    if ml_defense:
        return {"status": "active", "engine": "loaded"}
    return {"status": "degraded", "engine": "not_loaded"}

@app.post("/analyze", response_model=InspectionResponse)
def analyze_packet(request: InspectionRequest, response: Response, req: Request):
    if not ml_defense:
        raise HTTPException(status_code=503, detail="Defense engine not ready")

    client_ip = req.client.host if req.client else "IP not fetched"

    result = ml_defense.analyze_request(request.payload, client_ip)

    response.status_code = result.get("status", 200)

    return InspectionResponse(
        status=result.get("status", 200),
        message=result.get("msg", "Processed"),
        client_ip=client_ip,
        timestamp=datetime.utcnow().isoformat(),
        endpoint=req.url.path,       # NEW
        http_method=req.method,      # NEW
        payload=request.payload,     # NEW
        analysis=AnalysisDetails(
            verdict=result.get("classification", "Unknown"),
            confidence=result.get("confidence", 0.0),
            detected_by=result.get("detection_source", "System"),
            xai_explanation=result.get("xai_explanation")
        )
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
