from pydantic import BaseModel, Field
from datetime import datetime, date

class MaterialUsageBase(BaseModel):
    date: date
    material_id: str
    quantity_used: float
    purpose: str

class MaterialUsageCreate(MaterialUsageBase):
    factory_id: str

class MaterialUsage(MaterialUsageBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True

from typing import Optional