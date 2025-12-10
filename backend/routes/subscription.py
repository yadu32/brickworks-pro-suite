from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.subscription import (
    SubscriptionStatus, 
    CreateOrderRequest, 
    CreateOrderResponse,
    CompletePaymentRequest,
    RestoreSubscriptionRequest
)
from models import Factory
from datetime import datetime, timedelta
from database import get_database
from middleware.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/subscription", tags=["subscription"])

def calculate_days_remaining(end_date: datetime) -> int:
    """Calculate days remaining until expiry"""
    if not end_date:
        return 0
    now = datetime.utcnow()
    diff_time = (end_date - now).total_seconds()
    diff_days = diff_time / (60 * 60 * 24)
    return max(0, int(diff_days))

def get_subscription_status_from_factory(factory: dict) -> SubscriptionStatus:
    """Calculate subscription status from factory data"""
    now = datetime.utcnow()
    
    subscription_status = factory.get('subscription_status', 'trial')
    trial_ends_at = factory.get('trial_ends_at')
    plan_expiry_date = factory.get('plan_expiry_date')
    plan_type = factory.get('plan_type')
    
    # Check if lifetime plan
    if subscription_status == 'lifetime':
        return SubscriptionStatus(
            subscription_status='lifetime',
            trial_ends_at=None,
            plan_expiry_date=None,
            plan_type='lifetime',
            days_remaining=99999,
            is_trial_expired=False,
            is_active=True,
            can_perform_action=True
        )
    
    # Check if active subscription
    is_active = (
        subscription_status == 'active' and 
        plan_expiry_date and 
        plan_expiry_date > now
    )
    
    # Check if trial expired
    is_trial_expired = (
        subscription_status == 'trial' and 
        trial_ends_at and 
        trial_ends_at < now
    )
    
    # Calculate days remaining
    days_remaining = 0
    if is_active and plan_expiry_date:
        days_remaining = calculate_days_remaining(plan_expiry_date)
    elif not is_trial_expired and trial_ends_at:
        days_remaining = calculate_days_remaining(trial_ends_at)
    
    # Determine if user can perform actions
    can_perform_action = is_active or not is_trial_expired
    
    return SubscriptionStatus(
        subscription_status=subscription_status,
        trial_ends_at=trial_ends_at,
        plan_expiry_date=plan_expiry_date,
        plan_type=plan_type,
        days_remaining=days_remaining,
        is_trial_expired=is_trial_expired,
        is_active=is_active,
        can_perform_action=can_perform_action
    )

@router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user's subscription status"""
    factory = await db.factories.find_one({"owner_id": current_user["sub"]})
    
    if not factory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factory not found"
        )
    
    return get_subscription_status_from_factory(factory)

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_razorpay_order(
    order_request: CreateOrderRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a Razorpay order (MOCK IMPLEMENTATION)
    
    In production, this would:
    1. Call Razorpay API to create an order
    2. Store order details in database
    3. Return order_id and razorpay_key
    """
    factory = await db.factories.find_one({"owner_id": current_user["sub"]})
    
    if not factory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factory not found"
        )
    
    # MOCK: Generate a fake order ID
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:16]}"
    mock_razorpay_key = "rzp_test_MOCK_KEY_12345"
    
    # In production, you would call Razorpay API here:
    # razorpay_client.order.create({
    #     "amount": order_request.amount_in_paise,
    #     "currency": "INR",
    #     "receipt": f"receipt_{factory['id']}"
    # })
    
    return CreateOrderResponse(
        order_id=mock_order_id,
        razorpay_key=mock_razorpay_key,
        amount=order_request.amount_in_paise,
        currency="INR"
    )

@router.post("/complete", response_model=SubscriptionStatus)
async def complete_payment(
    payment_data: CompletePaymentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Complete payment and activate subscription (MOCK IMPLEMENTATION)
    
    In production, this would:
    1. Verify Razorpay signature
    2. Confirm payment status
    3. Activate subscription
    """
    factory = await db.factories.find_one({"owner_id": current_user["sub"]})
    
    if not factory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factory not found"
        )
    
    # MOCK: Skip signature verification
    # In production, verify signature:
    # from razorpay import Client
    # client = Client(auth=(key_id, key_secret))
    # client.utility.verify_payment_signature({
    #     'razorpay_order_id': payment_data.razorpay_order_id,
    #     'razorpay_payment_id': payment_data.razorpay_payment_id,
    #     'razorpay_signature': payment_data.razorpay_signature
    # })
    
    # Calculate expiry date based on plan
    now = datetime.utcnow()
    if payment_data.plan_id == 'monthly':
        expiry_date = now + timedelta(days=30)
    elif payment_data.plan_id == 'yearly':
        expiry_date = now + timedelta(days=365)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan_id"
        )
    
    # Update factory subscription
    await db.factories.update_one(
        {"id": factory["id"]},
        {
            "$set": {
                "subscription_status": "active",
                "plan_type": payment_data.plan_id,
                "plan_expiry_date": expiry_date
            }
        }
    )
    
    # Fetch updated factory
    updated_factory = await db.factories.find_one({"id": factory["id"]})
    
    return get_subscription_status_from_factory(updated_factory)

@router.post("/restore", response_model=SubscriptionStatus)
async def restore_subscription(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Restore subscription status (re-fetch from database)
    Useful when user switches devices or browsers
    """
    factory = await db.factories.find_one({"owner_id": current_user["sub"]})
    
    if not factory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factory not found"
        )
    
    return get_subscription_status_from_factory(factory)
