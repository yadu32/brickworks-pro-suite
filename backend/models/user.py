from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime
    last_active_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Admin Dashboard Models
class AdminUserData(BaseModel):
    id: str
    email: str
    owner_name: Optional[str] = None
    location: Optional[str] = None
    factory_name: Optional[str] = None
    phone_number: Optional[str] = None
    subscription_status: str = "Free"
    days_left: Optional[int] = None
    last_active_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True