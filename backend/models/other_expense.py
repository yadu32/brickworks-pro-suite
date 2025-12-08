from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

class OtherExpenseBase(BaseModel):
    date: date
    expense_type: str
    description: str
    amount: float
    vendor_name: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None

class OtherExpenseCreate(OtherExpenseBase):
    factory_id: str

class OtherExpenseUpdate(BaseModel):
    date: Optional[date] = None
    expense_type: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    vendor_name: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None

class OtherExpense(OtherExpenseBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True