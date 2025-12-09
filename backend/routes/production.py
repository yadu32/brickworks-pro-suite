from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import ProductionLog, ProductionLogCreate, ProductionLogUpdate
from typing import List, Optional
from database import get_database
from middleware.auth import get_current_user
from datetime import date

router = APIRouter(prefix="/production", tags=["production"])

@router.post("", response_model=ProductionLog, status_code=status.HTTP_201_CREATED)
async def create_production_log(
    production_data: ProductionLogCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verify factory ownership
    factory = await db.factories.find_one({"id": production_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    production = ProductionLog(**production_data.dict())
    production_dict = production.dict()
    # Convert date to string for MongoDB
    if 'date' in production_dict and production_dict['date']:
        production_dict['date'] = str(production_dict['date'])
    await db.production_logs.insert_one(production_dict)
    return production

@router.get("/factory/{factory_id}", response_model=List[ProductionLog])
async def get_factory_production(
    factory_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verify factory ownership
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {"factory_id": factory_id}
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter
    
    productions = await db.production_logs.find(query).sort("date", -1).to_list(1000)
    return [ProductionLog(**p) for p in productions]

@router.get("/{production_id}", response_model=ProductionLog)
async def get_production_log(
    production_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    production = await db.production_logs.find_one({"id": production_id})
    if not production:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    # Verify factory ownership
    factory = await db.factories.find_one({"id": production["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return ProductionLog(**production)

@router.put("/{production_id}", response_model=ProductionLog)
async def update_production_log(
    production_id: str,
    production_data: ProductionLogUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    production = await db.production_logs.find_one({"id": production_id})
    if not production:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    # Verify factory ownership
    factory = await db.factories.find_one({"id": production["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in production_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.production_logs.update_one(
            {"id": production_id},
            {"$set": update_data}
        )
    
    updated_production = await db.production_logs.find_one({"id": production_id})
    return ProductionLog(**updated_production)

@router.delete("/{production_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_production_log(
    production_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    production = await db.production_logs.find_one({"id": production_id})
    if not production:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    # Verify factory ownership
    factory = await db.factories.find_one({"id": production["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.production_logs.delete_one({"id": production_id})