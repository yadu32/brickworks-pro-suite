from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import OtherExpense, OtherExpenseCreate, OtherExpenseUpdate
from typing import List, Optional
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/other-expenses", tags=["other-expenses"])

@router.post("/", response_model=OtherExpense, status_code=status.HTTP_201_CREATED)
async def create_other_expense(
    expense_data: OtherExpenseCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    factory = await db.factories.find_one({"id": expense_data.factory_id, "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    expense = OtherExpense(**expense_data.dict())
    await db.other_expenses.insert_one(expense.dict())
    return expense

@router.get("/factory/{factory_id}", response_model=List[OtherExpense])
async def get_factory_other_expenses(
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
    
    expenses = await db.other_expenses.find(query).sort("date", -1).to_list(1000)
    return [OtherExpense(**e) for e in expenses]

@router.put("/{expense_id}", response_model=OtherExpense)
async def update_other_expense(
    expense_id: str,
    expense_data: OtherExpenseUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    expense = await db.other_expenses.find_one({"id": expense_id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    factory = await db.factories.find_one({"id": expense["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in expense_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.other_expenses.update_one(
            {"id": expense_id},
            {"$set": update_data}
        )
    
    updated_expense = await db.other_expenses.find_one({"id": expense_id})
    return OtherExpense(**updated_expense)

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_other_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    expense = await db.other_expenses.find_one({"id": expense_id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    factory = await db.factories.find_one({"id": expense["factory_id"], "owner_id": current_user["sub"]})
    if not factory:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.other_expenses.delete_one({"id": expense_id})