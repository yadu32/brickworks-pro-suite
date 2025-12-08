from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EmployeeBase(BaseModel):
    name: str
    phone: Optional[str] = None
    role: Optional[str] = None
    daily_wage: Optional[float] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    factory_id: str

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    daily_wage: Optional[float] = None
    is_active: Optional[bool] = None

class Employee(EmployeeBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True