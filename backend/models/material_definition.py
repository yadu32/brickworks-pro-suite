from pydantic import BaseModel, Field
from datetime import datetime

class MaterialDefinitionBase(BaseModel):
    name: str
    unit: str

class MaterialDefinitionCreate(MaterialDefinitionBase):
    factory_id: str

class MaterialDefinition(MaterialDefinitionBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True