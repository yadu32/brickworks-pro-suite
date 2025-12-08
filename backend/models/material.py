from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MaterialBase(BaseModel):
    material_name: str
    unit: str
    current_stock_qty: float = 0.0
    average_cost_per_unit: float = 0.0

class MaterialCreate(MaterialBase):
    factory_id: str

class MaterialUpdate(BaseModel):
    material_name: Optional[str] = None
    unit: Optional[str] = None
    current_stock_qty: Optional[float] = None
    average_cost_per_unit: Optional[float] = None

class Material(MaterialBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True