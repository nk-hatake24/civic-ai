from fastapi import APIRouter
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.auth.service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=dict) # We'll return the token and user_id
async def register(request: RegisterRequest):
    return await register_user(request)

@router.post("/login", response_model=dict)
async def login(request: LoginRequest):
    return await login_user(request)