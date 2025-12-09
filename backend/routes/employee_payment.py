from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import EmployeePayment, EmployeePaymentCreate
from typing import List, Optional
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/employee-payments", tags=["employee-payments"])

@router.post("", response_model=EmployeePayment, status_code=status.HTTP_201_CREATED)
async def create_employee_payment(
    payment_data: EmployeePaymentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": payment_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    payment = EmployeePayment(**payment_data.dict())
    await db.employee_payments.insert_one(payment.dict())
    return payment

@router.get("/factory/{factory_id}", response_model=List[EmployeePayment])
async def get_factory_employee_payments(
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
    
    payments = await db.employee_payments.find(query).sort("date", -1).to_list(1000)
    return [EmployeePayment(**p) for p in payments]

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    payment = await db.employee_payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    factory = await db.factories.find_one({"id": payment["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.employee_payments.delete_one({"id": payment_id})