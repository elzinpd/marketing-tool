from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import logging

from app.core.database import get_db
from app.db.models import User, Client
from app.core.security import get_password_hash
from app.api.deps import get_current_user, get_current_active_admin
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()
logger = logging.getLogger("users_api")

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str = "client_manager"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    clients: Optional[List[int]] = None

class ClientInfo(BaseModel):
    id: int
    name: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    clients: List[ClientInfo] = []

    class Config:
        from_attributes = True
        # Map the response field names to match the actual model attribute names
        model_config = {
            "json_schema_extra": {
                "example": {
                    "id": 1,
                    "email": "user@example.com",
                    "name": "John Doe",
                    "role": "client_manager",
                    "clients": [],
                    "is_active": True
                }
            }
        }

def prepare_user_response(user: User) -> Dict[str, Any]:
    """Convert User object to response format"""
    try:
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name if user.name else user.email.split('@')[0],
            "role": user.role,
            "is_active": user.is_active,
            "clients": [{"id": client.id, "name": client.name} for client in user.clients] if hasattr(user, "clients") and user.clients else []
        }
    except Exception as e:
        logger.error(f"Error preparing user response: {e}")
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name if user.name else user.email.split('@')[0],
            "role": user.role,
            "is_active": user.is_active,
            "clients": []
        }

@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can view all users"
        )
    
    users = db.query(User).all()
    return [prepare_user_response(user) for user in users]

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
    
    # Validate role
    valid_roles = ["admin", "agency_head", "client_manager"]
    if user.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    try:
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
        
        # Return user with properly formatted response
        return prepare_user_response(db_user)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )

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
    return prepare_user_response(db_user)

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
    try:
        # Get existing user
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Update user attributes
        if user.email is not None:
            db_user.email = user.email
        if user.name is not None:
            db_user.name = user.name
        if user.password is not None:
            db_user.hashed_password = get_password_hash(user.password)
        if user.role is not None:
            db_user.role = user.role
        if user.is_active is not None:
            db_user.is_active = user.is_active
            
        # Update client relationships if provided
        if user.clients is not None:
            clients = db.query(Client).filter(Client.id.in_(user.clients)).all()
            db_user.clients = clients
            
        db.commit()
        db.refresh(db_user)
        
        return prepare_user_response(db_user)
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )

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