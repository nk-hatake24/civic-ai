# backend/app/auth/schemas.py
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: EmailStr
    # We use 72 because that's the absolute max for the algorithm
    password: str = Field(..., min_length=8, max_length=72)
    full_name: str = Field(..., min_length=2)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str