from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Factory, FactoryCreate, FactoryUpdate
from typing import List
from datetime import datetime, timedelta
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/factories", tags=["factories"])

@router.post("", response_model=Factory, status_code=status.HTTP_201_CREATED)
async def create_factory(
    factory_data: FactoryCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Check if user already has a factory
    existing = await db.factories.find_one({"owner_id": current_user["sub"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a factory"
        )
    
    factory = Factory(
        **factory_data.dict(),
        owner_id=current_user["sub"],
        trial_ends_at=datetime.utcnow() + timedelta(days=30)
    )
    
    await db.factories.insert_one(factory.dict())
    return factory

@router.get("", response_model=List[Factory])
async def get_user_factories(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factories = await db.factories.find({"owner_id": current_user["sub"]}).to_list(100)
    return [Factory(**factory) for factory in factories]

@router.get("/{factory_id}", response_model=Factory)
async def get_factory(
    factory_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    return Factory(**factory)

@router.put("/{factory_id}", response_model=Factory)
async def update_factory(
    factory_id: str,
    factory_data: FactoryUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    
    update_data = {k: v for k, v in factory_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.factories.update_one(
            {"id": factory_id},
            {"$set": update_data}
        )
    
    updated_factory = await db.factories.find_one({"id": factory_id})
    return Factory(**updated_factory)

@router.delete("/{factory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_factory(
    factory_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    result = await db.factories.delete_one({"id": factory_id, "owner_id": current_user["sub"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Factory not found")