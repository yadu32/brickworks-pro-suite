"""
Test script to set a factory to trial-expired status
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

async def set_trial_expired():
    """Set one factory to trial expired for testing"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'brickworks')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Finding a factory to set as trial expired...")
    
    # Find first factory that's not lifetime
    factory = await db.factories.find_one({
        "subscription_status": {"$ne": "lifetime"}
    })
    
    if not factory:
        print("No non-lifetime factories found. Let's find any factory...")
        factory = await db.factories.find_one({})
    
    if not factory:
        print("No factories found in database!")
        client.close()
        return
    
    print(f"Found factory: {factory.get('name', 'Unknown')} (ID: {factory['id']})")
    print(f"Current status: {factory.get('subscription_status', 'None')}")
    
    # Set trial to expired (yesterday)
    expired_date = datetime.utcnow() - timedelta(days=1)
    
    result = await db.factories.update_one(
        {"id": factory["id"]},
        {
            "$set": {
                "subscription_status": "trial",
                "trial_ends_at": expired_date,
                "plan_type": None,
                "plan_expiry_date": None
            }
        }
    )
    
    if result.modified_count > 0:
        print(f"\n✓ Factory set to TRIAL EXPIRED status!")
        print(f"  - Trial ended: {expired_date.isoformat()}")
        print(f"  - Factory Name: {factory.get('name', 'Unknown')}")
        print(f"  - Factory ID: {factory['id']}")
        print(f"\nYou can now test the trial-expired flow with this factory's user.")
    else:
        print("Failed to update factory")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(set_trial_expired())
