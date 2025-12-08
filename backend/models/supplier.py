from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    contact_number: Optional[str] = None
    address: Optional[str] = None
    material_type: Optional[str] = None

class SupplierCreate(SupplierBase):
    factory_id: str

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    material_type: Optional[str] = None

class Supplier(SupplierBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True