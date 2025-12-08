from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import FactoryRate, FactoryRateCreate, FactoryRateUpdate
from typing import List
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/factory-rates", tags=["factory-rates"])

@router.post("/", response_model=FactoryRate, status_code=status.HTTP_201_CREATED)
async def create_factory_rate(
    rate_data: FactoryRateCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": rate_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    rate = FactoryRate(**rate_data.dict())
    await db.factory_rates.insert_one(rate.dict())
    return rate

@router.get("/factory/{factory_id}", response_model=List[FactoryRate])
async def get_factory_rates(
    factory_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    rates = await db.factory_rates.find({"factory_id": factory_id}).to_list(1000)
    return [FactoryRate(**r) for r in rates]

@router.put("/{rate_id}", response_model=FactoryRate)
async def update_factory_rate(
    rate_id: str,
    rate_data: FactoryRateUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    rate = await db.factory_rates.find_one({"id": rate_id})
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    
    factory = await db.factories.find_one({"id": rate["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in rate_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.factory_rates.update_one(
            {"id": rate_id},
            {"$set": update_data}
        )
    
    updated_rate = await db.factory_rates.find_one({"id": rate_id})
    return FactoryRate(**updated_rate)

@router.delete("/{rate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_factory_rate(
    rate_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    rate = await db.factory_rates.find_one({"id": rate_id})
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    
    factory = await db.factories.find_one({"id": rate["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.factory_rates.delete_one({"id": rate_id})