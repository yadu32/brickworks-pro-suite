from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# Import all routes
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Brickworks Pro Suite API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "Brickworks Pro Suite API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

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
    logger.info("Starting Brickworks Pro Suite API...")

@app.on_event("shutdown")
async def shutdown_db_client():
    client = get_db_client()
    client.close()
    logger.info("Shutting down Brickworks Pro Suite API...")
