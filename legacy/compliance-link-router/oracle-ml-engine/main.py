import os
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models import PredictionRequest, PredictionResponse, TrainingData, TrainingResponse
from security.waf_middleware import WAFMiddleware

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Aegis Route Oracle ML Engine",
    description="FastAPI foundation for Oracle ARM64 ML Engine with heavy continuous training datasets.",
    version="1.0.0"
)

# Add Advanced WAF Middleware
app.add_middleware(WAFMiddleware, enforce_ip_whitelist=False) # Configurable

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.post("/v1/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Ultra-fast inference endpoint.
    Target <30ms latency.
    """
    start_time = time.time()
    
    # Simple simulated logic based on features
    # features: [hasSusHeaders, isHeadlessUa, methodInt, uaLengthNormalized, ...]
    bot_prob = 0.05
    threat_level = "LOW"
    
    if request.feature_vector:
        if request.feature_vector[0] == 1: # hasSusHeaders
            bot_prob += 0.4
        if request.feature_vector[1] == 1: # isHeadlessUa
            bot_prob += 0.5
            
    if bot_prob >= 0.85:
        threat_level = "CRITICAL"
    elif bot_prob >= 0.5:
        threat_level = "MEDIUM"
        
    process_time_ms = (time.time() - start_time) * 1000
    
    return PredictionResponse(
        bot_probability=bot_prob,
        threat_level=threat_level,
        shap_values=[0.1, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        latency_ms=process_time_ms,
        model_version="1.0.0"
    )


@app.post("/train", response_model=TrainingResponse)
async def train(request: TrainingData):
    """
    Heavy continuous training endpoint handling DuckDB/SQLite/Pandas datasets.
    """
    # Placeholder for background training dispatch
    return TrainingResponse(
        status="queued",
        message=f"Training job queued using dataset at {request.dataset_uri}",
        model_name=request.model_name
    )


@app.get("/health")
async def health_check():
    """
    Basic health check, also protected by the API Key middleware.
    """
    return {"status": "healthy", "service": "Aegis Route Oracle ML Engine"}


if __name__ == "__main__":
    import uvicorn
    # Port 80/443 must not be exposed. Running on localhost port 8000 by default.
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
