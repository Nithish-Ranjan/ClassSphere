from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.user import RoleEnum


class LoginRequest(BaseModel):
    email_or_id: str
    password: str
    remember_me: Optional[bool] = False


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    institutional_id: str
    full_name: str
    role: RoleEnum
    phone_number: Optional[str] = None
    is_active: bool
    is_phone_verified: bool
    avatar_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SendOTPRequest(BaseModel):
    phone_number: str


class VerifyOTPRequest(BaseModel):
    phone_number: str
    code: str
