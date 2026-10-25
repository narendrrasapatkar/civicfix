from pydantic import BaseModel, EmailStr
from models.complaint import UserRole
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.CITIZEN

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    user_id: int
    full_name: str