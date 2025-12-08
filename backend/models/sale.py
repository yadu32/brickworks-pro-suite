from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

class SaleBase(BaseModel):
    date: date
    customer_name: str
    customer_phone: Optional[str] = None
    product_id: str
    quantity_sold: int
    rate_per_brick: float
    total_amount: float
    amount_received: float = 0.0
    balance_due: float = 0.0
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    factory_id: str

class SaleUpdate(BaseModel):
    date: Optional[date] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    product_id: Optional[str] = None
    quantity_sold: Optional[int] = None
    rate_per_brick: Optional[float] = None
    total_amount: Optional[float] = None
    amount_received: Optional[float] = None
    balance_due: Optional[float] = None
    notes: Optional[str] = None

class Sale(SaleBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True