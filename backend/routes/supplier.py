from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Supplier, SupplierCreate, SupplierUpdate
from typing import List
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

@router.post("", response_model=Supplier, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    supplier_data: SupplierCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": supplier_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    supplier = Supplier(**supplier_data.dict())
    await db.suppliers.insert_one(supplier.dict())
    return supplier

@router.get("/factory/{factory_id}", response_model=List[Supplier])
async def get_factory_suppliers(
    factory_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    suppliers = await db.suppliers.find({"factory_id": factory_id}).to_list(1000)
    return [Supplier(**s) for s in suppliers]

@router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier(
    supplier_id: str,
    supplier_data: SupplierUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    factory = await db.factories.find_one({"id": supplier["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in supplier_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.suppliers.update_one(
            {"id": supplier_id},
            {"$set": update_data}
        )
    
    updated_supplier = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated_supplier)

@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    factory = await db.factories.find_one({"id": supplier["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.suppliers.delete_one({"id": supplier_id})