from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductDefinitionBase(BaseModel):
    name: str
    items_per_punch: Optional[int] = None
    size_description: Optional[str] = None
    unit: str = "pieces"

class ProductDefinitionCreate(ProductDefinitionBase):
    factory_id: str

class ProductDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    items_per_punch: Optional[int] = None
    size_description: Optional[str] = None
    unit: Optional[str] = None

class ProductDefinition(ProductDefinitionBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True