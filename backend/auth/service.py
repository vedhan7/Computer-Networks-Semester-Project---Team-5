"""
JWT Authentication Service
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from backend.config import (
    ADMIN_USERNAME, ADMIN_PASSWORD,
    VIEWER_USERNAME, VIEWER_PASSWORD,
    JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES,
)

USERS = {
    ADMIN_USERNAME: {"password": ADMIN_PASSWORD, "role": "admin"},
    VIEWER_USERNAME: {"password": VIEWER_PASSWORD, "role": "viewer"},
}


def authenticate(username: str, password: str) -> Optional[dict]:
    user = USERS.get(username)
    if not user or user["password"] != password:
        return None
    return {"username": username, "role": user["role"]}


def create_token(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"username": payload["sub"], "role": payload.get("role", "viewer")}
    except JWTError:
        return None
