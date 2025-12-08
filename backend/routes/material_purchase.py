from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import MaterialPurchase, MaterialPurchaseCreate, MaterialPurchaseUpdate
from typing import List, Optional
from database import get_database
from middleware.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/material-purchases", tags=["material-purchases"])

@router.post("/", response_model=MaterialPurchase, status_code=status.HTTP_201_CREATED)
async def create_material_purchase(
    purchase_data: MaterialPurchaseCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": purchase_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    purchase = MaterialPurchase(**purchase_data.dict())
    await db.material_purchases.insert_one(purchase.dict())
    
    # Update material stock
    material = await db.materials.find_one({"id": purchase_data.material_id})
    if material:
        new_qty = material["current_stock_qty"] + purchase_data.quantity_purchased
        total_cost = (material["current_stock_qty"] * material["average_cost_per_unit"]) + (purchase_data.quantity_purchased * purchase_data.unit_cost)
        new_avg_cost = total_cost / new_qty if new_qty > 0 else 0
        
        await db.materials.update_one(
            {"id": purchase_data.material_id},
            {"$set": {
                "current_stock_qty": new_qty,
                "average_cost_per_unit": new_avg_cost,
                "updated_at": datetime.utcnow()
            }}
        )
    
    return purchase

@router.get("/factory/{factory_id}", response_model=List[MaterialPurchase])
async def get_factory_material_purchases(
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
    
    purchases = await db.material_purchases.find(query).sort("date", -1).to_list(1000)
    return [MaterialPurchase(**p) for p in purchases]

@router.delete("/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material_purchase(
    purchase_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    purchase = await db.material_purchases.find_one({"id": purchase_id})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    factory = await db.factories.find_one({"id": purchase["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.material_purchases.delete_one({"id": purchase_id})