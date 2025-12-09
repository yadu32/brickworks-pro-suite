from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import MaterialUsage, MaterialUsageCreate
from typing import List, Optional
from database import get_database
from middleware.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/material-usage", tags=["material-usage"])

@router.post("", response_model=MaterialUsage, status_code=status.HTTP_201_CREATED)
async def create_material_usage(
    usage_data: MaterialUsageCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": usage_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    usage = MaterialUsage(**usage_data.dict())
    usage_dict = usage.dict()
    # Convert date to string for MongoDB
    if 'date' in usage_dict and usage_dict['date']:
        usage_dict['date'] = str(usage_dict['date'])
    await db.material_usage.insert_one(usage_dict)
    
    # Update material stock
    material = await db.materials.find_one({"id": usage_data.material_id})
    if material:
        new_qty = material["current_stock_qty"] - usage_data.quantity_used
        await db.materials.update_one(
            {"id": usage_data.material_id},
            {"$set": {
                "current_stock_qty": max(0, new_qty),
                "updated_at": datetime.utcnow()
            }}
        )
    
    return usage

@router.get("/factory/{factory_id}", response_model=List[MaterialUsage])
async def get_factory_material_usage(
    factory_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
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
    
    usage_records = await db.material_usage.find(query).sort("date", -1).to_list(1000)
    return [MaterialUsage(**u) for u in usage_records]

@router.delete("/{usage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material_usage(
    usage_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    usage = await db.material_usage.find_one({"id": usage_id})
    if not usage:
        raise HTTPException(status_code=404, detail="Usage record not found")
    
    factory = await db.factories.find_one({"id": usage["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.material_usage.delete_one({"id": usage_id})