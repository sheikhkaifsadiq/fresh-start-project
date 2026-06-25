import os
import json
import sqlite3
import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel

router = APIRouter()

API_KEY_NAME = "X-Api-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

def get_api_key(api_key: str = Security(api_key_header)):
    expected_api_key = os.environ.get("ORACLE_API_KEY")
    if not expected_api_key:
        raise HTTPException(status_code=500, detail="Server misconfiguration: ORACLE_API_KEY not set")
    if api_key != expected_api_key:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

# We use SQLite for highly concurrent appending.
# Later, during the actual training phase, DuckDB can read this SQLite file 
# natively without needing to convert it! (using duckdb's sqlite_scanner)
DB_PATH = os.environ.get("DATASET_DB_PATH", "dataset.db")

def get_db_connection():
    # timeout handles cases where DB is locked by another process temporarily
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    # Enable WAL (Write-Ahead Logging) mode for better concurrency during streaming writes
    conn.execute('PRAGMA journal_mode=WAL;')
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS training_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            event_type TEXT,
            visitor_id TEXT,
            link_id TEXT,
            url TEXT,
            ip_hash TEXT,
            user_agent TEXT,
            geo_country TEXT,
            features JSON,
            is_bot BOOLEAN,
            raw_payload JSON
        )
    """)
    # Index for fast retrieval during training filtering
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON training_events(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_event_type ON training_events(event_type);")
    conn.commit()
    conn.close()

# Initialize database on module load
init_db()

class StreamingEvent(BaseModel):
    event_type: str
    visitor_id: Optional[str] = None
    link_id: Optional[str] = None
    url: Optional[str] = None
    ip_hash: Optional[str] = None
    user_agent: Optional[str] = None
    geo_country: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    is_bot: Optional[bool] = None
    
    # Support both Pydantic v1 and v2 for allowing extra fields
    class Config:
        extra = "allow"

class StreamingPayload(BaseModel):
    events: List[StreamingEvent]

@router.post("/v1/train/continuous")
async def train_continuous(payload: StreamingPayload, api_key: str = Depends(get_api_key)):
    """
    Receives continuous tracking payloads from Vercel Edge endpoints and 
    appends them to the local SQLite dataset file. 
    Ultra-fast execution (usually < 10ms).
    """
    if not payload.events:
        return {"status": "success", "inserted": 0}
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        insert_data = []
        for event in payload.events:
            # Pydantic v1 vs v2 compatibility for dict export
            event_dict = event.model_dump() if hasattr(event, "model_dump") else event.dict()
            
            features_json = json.dumps(event.features) if event.features is not None else None
            
            # Store all fields in raw_payload to capture any extra schema-less fields
            raw_payload_json = json.dumps(event_dict)
            
            insert_data.append((
                event.event_type,
                event.visitor_id,
                event.link_id,
                event.url,
                event.ip_hash,
                event.user_agent,
                event.geo_country,
                features_json,
                event.is_bot,
                raw_payload_json
            ))
            
        cursor.executemany("""
            INSERT INTO training_events (
                event_type, visitor_id, link_id, url, 
                ip_hash, user_agent, geo_country, features, is_bot, raw_payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, insert_data)
        
        conn.commit()
        inserted_count = len(insert_data)
        return {"status": "success", "inserted": inserted_count}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()
