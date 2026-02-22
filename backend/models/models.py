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
        orm_mode = True

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

class AuditLog(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
