from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = "user"
    auth_provider: str = "local"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    active: bool
    must_change_password: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class Session(BaseModel):
    token: str
    user_id: int
    expires_at: datetime
    ip_address: str
    user_agent: str
    created_at: datetime

class License(BaseModel):
    id: str
    client_name: str
    tier: str
    features: List[str]
    max_gpus: int
    expires_at: datetime
    fingerprint: Optional[str]
    raw_license: str
    activated_at: Optional[datetime]

class Conversation(BaseModel):
    id: str
    user_id: int
    title: str
    model: str
    created_at: datetime
    updated_at: datetime

class Message(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    tokens: Optional[int]
    created_at: datetime

class ChatRequest(BaseModel):
    model: str
    messages: List[dict]
    conversation_id: Optional[str] = None
    stream: bool = False

class AuditLog(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    
# API Keys Models
class APIKeyBase(BaseModel):
    name: str # e.g. "Production Bot"
    description: Optional[str] = None
    allowed_models: List[str] # e.g. ["llama3", "mistral"] or [] for all
    expires_at: Optional[datetime] = None

class APIKeyCreate(APIKeyBase):
    user_id: int # Assign to user

class APIKey(APIKeyBase):
    id: int
    prefix: str # "sk-abcd..."
    user_id: int
    created_at: datetime
    last_used_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True

class APIKeyResponse(BaseModel):
    key: str # The full secret key, only returned once
    info: APIKey
