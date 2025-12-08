from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

class FactoryRateBase(BaseModel):
    rate_type: str
    rate_amount: float
    effective_date: date = Field(default_factory=date.today)
    is_active: bool = True
    brick_type_id: Optional[str] = None

class FactoryRateCreate(FactoryRateBase):
    factory_id: str

class FactoryRateUpdate(BaseModel):
    rate_type: Optional[str] = None
    rate_amount: Optional[float] = None
    effective_date: Optional[date] = None
    is_active: Optional[bool] = None
    brick_type_id: Optional[str] = None

class FactoryRate(FactoryRateBase):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    factory_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True