from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.db.database import get_db
from app.models.models import User, Client
from app.core.security import get_password_hash
from app.api.deps import get_current_active_admin

router = APIRouter()

class UserBase(BaseModel):
    email: EmailStr
    role: str = "user"
    assigned_clients: List[int] = []

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

@router.get("", response_model=List[UserResponse])
async def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Get all users (admin only)
    """
    users = db.query(User).all()
    return users

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Create a new user (admin only)
    """
    # Check if user with this email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Assign clients
    if user.assigned_clients:
        clients = db.query(Client).filter(Client.id.in_(user.assigned_clients)).all()
        db_user.assigned_clients = clients
        db.commit()
    
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Get a specific user by ID (admin only)
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Update a user (admin only)
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Update email and role
    db_user.email = user.email
    db_user.role = user.role
    
    # Update password if provided
    if user.password:
        db_user.hashed_password = get_password_hash(user.password)
    
    # Update assigned clients
    if user.assigned_clients is not None:
        clients = db.query(Client).filter(Client.id.in_(user.assigned_clients)).all()
        db_user.assigned_clients = clients
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Delete a user (admin only)
    """
    # Cannot delete yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete yourself"
        )
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    db.delete(db_user)
    db.commit()
    return None 