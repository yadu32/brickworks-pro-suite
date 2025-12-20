from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import AdminUserData
from typing import List
from database import get_database
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["admin"])

# Admin PIN for access control
ADMIN_PIN = "2129"

@router.post("/verify-pin")
async def verify_admin_pin(pin: str):
    """Verify admin PIN for dashboard access"""
    if pin == ADMIN_PIN:
        return {"valid": True}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin PIN"
    )

@router.get("/users", response_model=List[AdminUserData])
async def get_all_users(
    pin: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all registered users with their factory and subscription data"""
    # Verify PIN first
    if pin != ADMIN_PIN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin PIN"
        )
    
    # Get all users
    users = await db.users.find().to_list(1000)
    
    result = []
    for user in users:
        # Get user's factory data
        factory = await db.factories.find_one({"owner_id": user["id"]})
        
        # Calculate subscription status and days left
        subscription_status = "Free"
        days_left = None
        
        if factory:
            sub_status = factory.get("subscription_status", "free")
            if sub_status == "trial":
                subscription_status = "Trial"
                trial_ends = factory.get("trial_ends_at")
                if trial_ends:
                    if isinstance(trial_ends, str):
                        trial_ends = datetime.fromisoformat(trial_ends.replace('Z', '+00:00'))
                    days_left = (trial_ends - datetime.utcnow()).days
                    if days_left < 0:
                        days_left = 0
                        subscription_status = "Expired"
            elif sub_status == "active":
                subscription_status = "Premium"
                plan_expiry = factory.get("plan_expiry_date")
                if plan_expiry:
                    if isinstance(plan_expiry, str):
                        plan_expiry = datetime.fromisoformat(plan_expiry.replace('Z', '+00:00'))
                    days_left = (plan_expiry - datetime.utcnow()).days
                    if days_left < 0:
                        days_left = 0
                        subscription_status = "Expired"
            elif sub_status == "lifetime":
                subscription_status = "Lifetime"
                days_left = None
            elif sub_status == "expired":
                subscription_status = "Expired"
                days_left = 0
        
        admin_user = AdminUserData(
            id=user["id"],
            email=user["email"],
            owner_name=factory.get("owner_name") if factory else None,
            location=factory.get("location") if factory else None,
            factory_name=factory.get("name") if factory else None,
            phone_number=factory.get("contact_number") if factory else None,
            subscription_status=subscription_status,
            days_left=days_left,
            last_active_at=user.get("last_active_at"),
            created_at=user["created_at"]
        )
        result.append(admin_user)
    
    # Sort by last_active_at (most recent first)
    result.sort(key=lambda x: x.last_active_at or datetime.min, reverse=True)
    
    return result
