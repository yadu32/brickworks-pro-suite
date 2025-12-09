from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Customer, CustomerCreate, CustomerUpdate
from typing import List
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("", response_model=Customer, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": customer_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    customer = Customer(**customer_data.dict())
    customer_dict = customer.dict()
    # Convert date to string for MongoDB
    if 'date' in customer_dict and customer_dict['date']:
        customer_dict['date'] = str(customer_dict['date'])
    await db.customers.insert_one(customer_dict)
    return customer

@router.get("/factory/{factory_id}", response_model=List[Customer])
async def get_factory_customers(
    factory_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    customers = await db.customers.find({"factory_id": factory_id}).to_list(1000)
    return [Customer(**c) for c in customers]

@router.put("/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str,
    customer_data: CustomerUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    factory = await db.factories.find_one({"id": customer["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in customer_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.customers.update_one(
            {"id": customer_id},
            {"$set": update_data}
        )
    
    updated_customer = await db.customers.find_one({"id": customer_id})
    return Customer(**updated_customer)

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    factory = await db.factories.find_one({"id": customer["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.customers.delete_one({"id": customer_id})