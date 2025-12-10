from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SubscriptionStatus(BaseModel):
    subscription_status: str  # 'trial', 'active', 'expired', 'lifetime'
    trial_ends_at: Optional[datetime] = None
    plan_expiry_date: Optional[datetime] = None
    plan_type: Optional[str] = None  # 'monthly', 'yearly', 'lifetime'
    days_remaining: int = 0
    is_trial_expired: bool = False
    is_active: bool = False
    can_perform_action: bool = True

class CreateOrderRequest(BaseModel):
    amount_in_paise: int
    plan_id: str  # 'monthly' or 'yearly'

class CreateOrderResponse(BaseModel):
    order_id: str
    razorpay_key: str
    amount: int
    currency: str = "INR"

class CompletePaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan_id: str  # 'monthly' or 'yearly'

class RestoreSubscriptionRequest(BaseModel):
    pass  # Empty, will use current user from auth

class SubscriptionUpdateRequest(BaseModel):
    subscription_status: str
    plan_type: str
    plan_expiry_date: datetime
