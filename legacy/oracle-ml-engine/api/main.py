import os
from fastapi import FastAPI, Depends, HTTPException, Security, Request
from fastapi.responses import JSONResponse
import duckdb
import pandas as pd
import time
import sys

# Add root directory to path for imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from security.waf_middleware import WAFMiddleware

# Initialize FastAPI application
app = FastAPI(title="Aegis Route ML Engine")

# Add Advanced WAF Middleware
app.add_middleware(WAFMiddleware, enforce_ip_whitelist=False) # Enable or disable based on env

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Connect to an in-memory DuckDB instance (could also be persistent file)
db_conn = duckdb.connect(database=':memory:', read_only=False)

@app.get("/health")
async def health_check():
    """Secure health check endpoint"""
    return {"status": "healthy"}

@app.post("/predict")
async def predict(data: dict):
    """
    Ultra-fast inference endpoint.
    Expects input data to perform real-time model scoring.
    """
    try:
        # Dummy inference logic for <30ms requirement
        # In a real setup, this would use the DuckDB/Pandas loaded model datasets
        
        # Simulated feature processing
        features = data.get("features", [])
        
        # Example prediction output
        score = sum(features) / len(features) if features else 0.0
        
        return {
            "prediction": score,
            "confidence": 0.95,
            "status": "success"
        }
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/train")
async def train(data: list):
    """
    Continuous training endpoint.
    Handles heavy continuous training datasets (e.g., using DuckDB/SQLite/Pandas).
    """
    try:
        # Convert incoming data to a Pandas DataFrame
        df = pd.DataFrame(data)
        
        # Ingest the dataframe into DuckDB for fast analytics and pre-processing
        db_conn.execute("CREATE TABLE IF NOT EXISTS training_data AS SELECT * FROM df")
        
        # Simulated heavy continuous training...
        # Update model parameters, etc.
        
        return {"status": "success", "message": "Training data ingested successfully."}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=3001, reload=False)
