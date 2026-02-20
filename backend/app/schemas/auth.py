from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: Optional[str] = "fresher"
    department: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1440
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    department: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
