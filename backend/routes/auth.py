from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import User, UserCreate, UserLogin, Token, UserResponse
from utils.auth import verify_password, get_password_hash, create_access_token
from datetime import timedelta, datetime
from database import get_database

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    
    user_dict = user.dict()
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        created_at=user.created_at
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Find user
    user_data = await db.users.find_one({"email": credentials.email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_data["id"], "email": user_data["email"]}
    )
    
    user_response = UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        created_at=user_data["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(__import__('middleware.auth', fromlist=['get_current_user']).get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user_data = await db.users.find_one({"id": current_user["sub"]})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        created_at=user_data["created_at"]
    )