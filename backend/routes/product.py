from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import ProductDefinition, ProductDefinitionCreate, ProductDefinitionUpdate
from typing import List
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductDefinition, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductDefinitionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verify factory ownership
    factory = await db.factories.find_one({"id": product_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized to access this factory")
    
    product = ProductDefinition(**product_data.dict())
    product_dict = product.dict()
    # Convert date to string for MongoDB
    if 'date' in product_dict and product_dict['date']:
        product_dict['date'] = str(product_dict['date'])
    await db.product_definitions.insert_one(product_dict)
    return product

@router.get("/factory/{factory_id}", response_model=List[ProductDefinition])
async def get_factory_products(
    factory_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verify factory ownership
    factory = await db.factories.find_one({"id": factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    products = await db.product_definitions.find({"factory_id": factory_id}).to_list(1000)
    return [ProductDefinition(**p) for p in products]

@router.get("/{product_id}", response_model=ProductDefinition)
async def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    product = await db.product_definitions.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify factory ownership
    factory = await db.factories.find_one({"id": product["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return ProductDefinition(**product)

@router.put("/{product_id}", response_model=ProductDefinition)
async def update_product(
    product_id: str,
    product_data: ProductDefinitionUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    product = await db.product_definitions.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify factory ownership
    factory = await db.factories.find_one({"id": product["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in product_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.product_definitions.update_one(
            {"id": product_id},
            {"$set": update_data}
        )
    
    updated_product = await db.product_definitions.find_one({"id": product_id})
    return ProductDefinition(**updated_product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    product = await db.product_definitions.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify factory ownership
    factory = await db.factories.find_one({"id": product["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.product_definitions.delete_one({"id": product_id})