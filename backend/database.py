from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables (only if .env exists, for development)
# In production, env vars are injected by Kubernetes
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()  # Try to load from environment or parent directories

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'brickworks_db')

client = AsyncIOMotorClient(mongo_url)
database = client[db_name]

async def get_database() -> AsyncIOMotorDatabase:
    return database

def get_db_client():
    return client
