from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

class EmployeePaymentBase(BaseModel):
    date: date
    employee_name: str
    amount: float
    payment_type: str
    notes: Optional[str] = None

class EmployeePaymentCreate(EmployeePaymentBase):
    factory_id: str

class EmployeePayment(EmployeePaymentBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True