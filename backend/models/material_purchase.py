from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

class MaterialPurchaseBase(BaseModel):
    date: date
    material_id: str
    quantity_purchased: float
    unit_cost: float
    supplier_name: str
    supplier_phone: Optional[str] = None
    payment_made: float = 0.0
    notes: Optional[str] = None

class MaterialPurchaseCreate(MaterialPurchaseBase):
    factory_id: str

class MaterialPurchaseUpdate(BaseModel):
    date: Optional[date] = None
    material_id: Optional[str] = None
    quantity_purchased: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier_name: Optional[str] = None
    supplier_phone: Optional[str] = None
    payment_made: Optional[float] = None
    notes: Optional[str] = None

class MaterialPurchase(MaterialPurchaseBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True