from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth & Registration Schemas
class UserRegister(BaseModel):
    email: str
    password: str
    confirm_password: str
    full_name: str
    username: Optional[str] = None
    phone_number: Optional[str] = None
    channel: Optional[str] = "email" # "email" or "sms"

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Hero User"

class UserLogin(BaseModel):
    email: str
    password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str

class ResendOTPRequest(BaseModel):
    email: str
    channel: Optional[str] = "email"
    phone_number: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str
    confirm_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

class UserOut(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserOut

# Profile & Settings
class ProfileOut(BaseModel):
    id: str
    user_id: str
    bio: Optional[str]
    preferred_ai_model: str
    theme: str
    language: Optional[str] = "en"
    notification_settings: Dict[str, Any]

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    preferred_ai_model: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    notification_settings: Optional[Dict[str, Any]] = None

# Chat Schemas
class MessageOut(BaseModel):
    id: str
    chat_id: str
    role: str
    content: str
    reactions: Optional[Dict[str, Any]] = {}
    created_at: datetime

    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class ChatOut(BaseModel):
    id: str
    user_id: str
    title: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True

class ChatMessageRequest(BaseModel):
    chat_id: Optional[str] = None
    message: str
    model: Optional[str] = "gemini-3.6-flash"

# Tool Requests
class ToolRequest(BaseModel):
    tool_type: str
    input_text: str
    extra_params: Optional[Dict[str, Any]] = {}
