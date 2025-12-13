from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# CRITICAL: Load environment variables FIRST before any other imports
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import all routes AFTER loading env vars
from routes import (
    auth_router,
    factory_router,
    product_router,
    production_router,
    material_router,
    material_purchase_router,
    material_usage_router,
    sale_router,
    customer_router,
    supplier_router,
    employee_router,
    employee_payment_router,
    factory_rate_router,
    other_expense_router,
    subscription_router,
)
from database import get_db_client

# Create the main app
app = FastAPI(title="BricksFlow API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "BricksFlow API", "status": "running"}

@api_router.get("/health")
async def health_check():
    """Basic health check - returns healthy if server is running"""
    return {"status": "healthy"}

@api_router.get("/health/db")
async def database_health_check():
    """Database health check - verifies MongoDB connection"""
    try:
        client = get_db_client()
        await client.admin.command('ping')
        db_name = os.environ.get('DB_NAME', 'brickworks_db')
        # Try to count documents in a collection to verify database access
        from database import get_database
        db = await get_database()
        # Just check if we can access the database
        collections = await db.list_collection_names()
        return {
            "status": "healthy",
            "database": db_name,
            "connected": True,
            "collections_count": len(collections)
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": os.environ.get('DB_NAME', 'brickworks_db'),
            "connected": False,
            "error": str(e)
        }

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(factory_router)
api_router.include_router(product_router)
api_router.include_router(production_router)
api_router.include_router(material_router)
api_router.include_router(material_purchase_router)
api_router.include_router(material_usage_router)
api_router.include_router(sale_router)
api_router.include_router(customer_router)
api_router.include_router(supplier_router)
api_router.include_router(employee_router)
api_router.include_router(employee_payment_router)
api_router.include_router(factory_rate_router)
api_router.include_router(other_expense_router)
api_router.include_router(subscription_router)

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting BricksFlow API...")
    
    # Test database connection on startup
    try:
        client = get_db_client()
        # Ping the database to verify connection
        await client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB at {os.environ.get('MONGO_URL', 'default')}")
        logger.info(f"Using database: {os.environ.get('DB_NAME', 'brickworks_db')}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.error("Application will continue but database operations may fail")
        # Don't raise - let the app start anyway for health checks

@app.on_event("shutdown")
async def shutdown_db_client():
    client = get_db_client()
    client.close()
    logger.info("Shutting down Brickworks Pro Suite API...")
