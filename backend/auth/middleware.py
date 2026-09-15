"""
FastAPI dependency for route protection.
"""
from fastapi import HTTPException, Header
from typing import Optional
from backend.auth.service import decode_token


def require_auth(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token expired or invalid")
    return payload


def require_admin(user: dict = None, authorization: Optional[str] = Header(None)) -> dict:
    user = require_auth(authorization)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user
