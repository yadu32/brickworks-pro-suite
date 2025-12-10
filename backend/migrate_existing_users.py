"""
Migration script to set existing users to lifetime free plan
Run this once to grandfather existing users
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

async def migrate_existing_users():
    """Set all existing factories to lifetime plan"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'brickworks')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Starting migration...")
    print(f"Connected to database: {db_name}")
    
    # Find all factories with trial or no subscription status
    factories = await db.factories.find({
        "subscription_status": {"$in": ["trial", None]}
    }).to_list(1000)
    
    print(f"Found {len(factories)} factories to migrate")
    
    updated_count = 0
    for factory in factories:
        result = await db.factories.update_one(
            {"id": factory["id"]},
            {
                "$set": {
                    "subscription_status": "lifetime",
                    "plan_type": "lifetime",
                    "plan_expiry_date": None,
                    "trial_ends_at": None
                }
            }
        )
        if result.modified_count > 0:
            updated_count += 1
            print(f"✓ Migrated factory: {factory.get('name', 'Unknown')} (ID: {factory['id']})")
    
    print(f"\nMigration complete! Updated {updated_count} factories to lifetime plan.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_existing_users())
