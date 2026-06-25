"""
Advanced Security Module for Oracle ML Engine
Enforces:
1. IP Allowlist (Next.js/Vercel webhook IPs)
2. API Key Authentication (X-Api-Key)
3. Request Size Limiting (Protects against heavy payloads)
4. Strict Token Bucket Rate Limiting (Protects against DDoS/Spam)
"""

import os
import time
import ipaddress
import logging
from typing import Callable, Dict
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# Constants and Configuration
MAX_REQUEST_SIZE_BYTES = int(os.environ.get("MAX_REQUEST_SIZE_BYTES", 5 * 1024 * 1024)) # 5MB limit
EXPECTED_API_KEY = os.environ.get("ORACLE_API_KEY") or os.environ.get("ORACLE_ML_API_KEY") or os.environ.get("API_KEY") or "default-secure-key-change-me"
ALLOWED_IPS_ENV = os.environ.get("ALLOWED_WEBHOOK_IPS", "")

# Parse allowed IPs/CIDRs
ALLOWED_NETWORKS = []
if ALLOWED_IPS_ENV:
    for ip_str in ALLOWED_IPS_ENV.split(","):
        ip_str = ip_str.strip()
        if ip_str:
            try:
                ALLOWED_NETWORKS.append(ipaddress.ip_network(ip_str, strict=False))
            except ValueError as e:
                logger.error(f"Invalid IP network configured: {ip_str}. Error: {e}")

class RateLimiter:
    """
    In-memory Token Bucket Rate Limiter
    Limits requests per client IP to prevent abuse.
    """
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens: Dict[str, float] = {}
        self.last_refill: Dict[str, float] = {}

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        if client_id not in self.tokens:
            self.tokens[client_id] = float(self.capacity)
            self.last_refill[client_id] = now
            
        time_passed = now - self.last_refill[client_id]
        new_tokens = time_passed * self.refill_rate
        
        self.tokens[client_id] = min(float(self.capacity), self.tokens[client_id] + new_tokens)
        self.last_refill[client_id] = now
        
        if self.tokens[client_id] >= 1.0:
            self.tokens[client_id] -= 1.0
            return True
        return False

# Global rate limiter: Burst capacity 10 requests, refill 2 requests per second
rate_limiter = RateLimiter(capacity=10, refill_rate=2.0)


class WAFMiddleware(BaseHTTPMiddleware):
    """
    Web Application Firewall Middleware for FastAPI.
    - Validates X-Api-Key
    - Validates IP against allowed Next.js webhook IPs
    - Limits request size
    - Enforces rate limiting
    """
    def __init__(self, app, enforce_ip_whitelist: bool = True):
        super().__init__(app)
        self.enforce_ip_whitelist = enforce_ip_whitelist

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"

        # 1. API Key Authentication (must not expose to public, prevents port scanning/probing)
        api_key = request.headers.get("X-Api-Key")
        if not api_key or api_key != EXPECTED_API_KEY:
            logger.warning(f"Unauthorized access attempt from {client_ip}. Invalid API Key.")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Unauthorized: Invalid or missing X-Api-Key"}
            )

        # 2. IP Whitelisting (Optional but recommended for Next.js Webhooks)
        if self.enforce_ip_whitelist and ALLOWED_NETWORKS and client_ip != "unknown":
            try:
                ip_obj = ipaddress.ip_address(client_ip)
                is_allowed = any(ip_obj in network for network in ALLOWED_NETWORKS)
                if not is_allowed:
                    logger.warning(f"Blocked request from unauthorized IP: {client_ip}")
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": "Forbidden: IP address not allowed"}
                    )
            except ValueError:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Bad Request: Invalid client IP"}
                )

        # 3. Request Size Limiting (Protects ML Engine from OOM on large payloads)
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > MAX_REQUEST_SIZE_BYTES:
                    logger.warning(f"Blocked oversized request ({length} bytes) from {client_ip}")
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"detail": f"Payload Too Large: Max allowed is {MAX_REQUEST_SIZE_BYTES} bytes"}
                    )
            except ValueError:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Bad Request: Invalid content-length header"}
                )

        # 4. Strict Rate Limiting
        # Rate limit based on API key or IP. Using IP here to prevent single-source flooding.
        if not rate_limiter.is_allowed(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too Many Requests: Rate limit exceeded. Please slow down."}
            )

        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(f"Internal server error processing request from {client_ip}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal Server Error"}
            )
