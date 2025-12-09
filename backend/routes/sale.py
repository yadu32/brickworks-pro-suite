from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Sale, SaleCreate, SaleUpdate
from typing import List, Optional
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("", response_model=Sale, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_data: SaleCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": sale_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sale = Sale(**sale_data.dict())
    sale_dict = sale.dict()
    # Convert date to string for MongoDB
    if 'date' in sale_dict and sale_dict['date']:
        sale_dict['date'] = str(sale_dict['date'])
    await db.sales.insert_one(sale_dict)
    return sale

@router.get("/factory/{factory_id}", response_model=List[Sale])
async def get_factory_sales(
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
    
    sales = await db.sales.find(query).sort("date", -1).to_list(1000)
    return [Sale(**s) for s in sales]

@router.get("/{sale_id}", response_model=Sale)
async def get_sale(
    sale_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    sale = await db.sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    factory = await db.factories.find_one({"id": sale["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return Sale(**sale)

@router.put("/{sale_id}", response_model=Sale)
async def update_sale(
    sale_id: str,
    sale_data: SaleUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    sale = await db.sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    factory = await db.factories.find_one({"id": sale["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in sale_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.sales.update_one(
            {"id": sale_id},
            {"$set": update_data}
        )
    
    updated_sale = await db.sales.find_one({"id": sale_id})
    return Sale(**updated_sale)

@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale(
    sale_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    sale = await db.sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    factory = await db.factories.find_one({"id": sale["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.sales.delete_one({"id": sale_id})