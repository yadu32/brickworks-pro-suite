from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FactoryBase(BaseModel):
    name: str
    location: Optional[str] = None

class FactoryCreate(FactoryBase):
    pass

class FactoryUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    subscription_status: Optional[str] = None
    plan_type: Optional[str] = None
    plan_expiry_date: Optional[datetime] = None

class Factory(FactoryBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    owner_id: str
    subscription_status: str = "trial"
    trial_ends_at: Optional[datetime] = None
    plan_expiry_date: Optional[datetime] = None
    plan_type: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True