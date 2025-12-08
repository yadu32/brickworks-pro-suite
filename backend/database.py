from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'brickworks_db')

client = AsyncIOMotorClient(mongo_url)
database = client[db_name]

async def get_database() -> AsyncIOMotorDatabase:
    return database

def get_db_client():
    return client
