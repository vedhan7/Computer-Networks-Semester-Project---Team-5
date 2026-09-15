from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.auth.service import authenticate, create_token
from backend.auth.middleware import require_auth

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(req: LoginRequest):
    user = authenticate(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["username"], user["role"])
    return {"token": token, "username": user["username"], "role": user["role"]}


@router.get("/me")
async def me(user: dict = Depends(require_auth)):
    return user
