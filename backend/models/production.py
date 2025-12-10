from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductionLogBase(BaseModel):
    date: Optional[str] = None
    product_id: str
    product_name: str
    quantity: int
    punches: Optional[int] = None
    remarks: Optional[str] = None

class ProductionLogCreate(ProductionLogBase):
    factory_id: str

class ProductionLogUpdate(BaseModel):
    date: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    punches: Optional[int] = None
    remarks: Optional[str] = None

class ProductionLog(ProductionLogBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True