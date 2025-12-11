from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Material, MaterialCreate, MaterialUpdate
from typing import List
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/materials", tags=["materials"])

@router.post("", response_model=Material, status_code=status.HTTP_201_CREATED)
async def create_material(
    material_data: MaterialCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": material_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    material = Material(**material_data.dict())
    material_dict = material.dict()
    # Convert date to string for MongoDB
    if 'date' in material_dict and material_dict['date']:
        material_dict['date'] = str(material_dict['date'])
    await db.materials.insert_one(material_dict)
    return material

@router.get("/factory/{factory_id}", response_model=List[Material])
async def get_factory_materials(
    factory_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    materials = await db.materials.find({"factory_id": factory_id}).to_list(1000)
    return [Material(**m) for m in materials]

@router.put("/{material_id}", response_model=Material)
async def update_material(
    material_id: str,
    material_data: MaterialUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    material = await db.materials.find_one({"id": material_id})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    factory = await db.factories.find_one({"id": material["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in material_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.materials.update_one(
            {"id": material_id},
            {"$set": update_data}
        )
    
    updated_material = await db.materials.find_one({"id": material_id})
    return Material(**updated_material)

@router.get("/{material_id}/stock")
async def get_material_stock(
    material_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get material stock breakdown: purchased, used, and current stock"""
    material = await db.materials.find_one({"id": material_id})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    factory = await db.factories.find_one({"id": material["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate total purchased from material_purchases collection (optimized with limit)
    purchases_cursor = db.material_purchases.find(
        {"material_id": material_id},
        {"quantity_purchased": 1}
    )
    purchases = await purchases_cursor.to_list(10000)  # Reasonable limit for production
    total_purchased = sum(p.get("quantity_purchased", 0) for p in purchases)
    
    # Calculate total used from material_usage collection (optimized with limit)
    usages_cursor = db.material_usage.find(
        {"material_id": material_id},
        {"quantity_used": 1}
    )
    usages = await usages_cursor.to_list(10000)  # Reasonable limit for production
    total_used = sum(u.get("quantity_used", 0) for u in usages)
    
    # Current stock = purchased - used
    current_stock = total_purchased - total_used
    
    return {
        "currentStock": max(0, current_stock),
        "totalPurchased": total_purchased,
        "totalUsed": total_used,
        "totalOut": 0  # For future use
    }

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    material = await db.materials.find_one({"id": material_id})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    factory = await db.factories.find_one({"id": material["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.materials.delete_one({"id": material_id})