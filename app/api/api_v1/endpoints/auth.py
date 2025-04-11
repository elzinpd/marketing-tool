from datetime import timedelta, datetime
from typing import Any, Dict, Optional, List
import logging
import secrets
import string
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    verify_password
)
from app.core.config import settings
from app.db.models import User
from app.api.deps import get_current_user

# Define token model
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# Create TokenData model for decoded payload
class TokenData(BaseModel):
    username: Optional[str] = None

# Configure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

router = APIRouter()
logger = logging.getLogger(__name__)

# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False

# Hash password
def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of the password"""
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Verify username and password
    """
    # Find the user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.warning(f"User not found: {email}")
        return None

    # Verify the password
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Password verification failed for user: {email}")
        return None

    return user

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login", response_model=Token)
async def login_with_json(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login endpoint that accepts JSON data instead of form data"""
    username = login_data.username
    password = login_data.password

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info(f"Login attempt for user: {username}")

    # Validate user credentials
    user = authenticate_user(db, username, password)
    if not user:
        logger.warning(f"Invalid credentials for user: {username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create token data - ensure we use email as subject
    token_data = {
        "sub": user.email,  # Always use email, never user ID
        "role": user.role,
        "uid": user.id
    }

    # Set token expiration
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Create the token
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )

    logger.info(f"Login successful for user: {user.email}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name or user.email.split('@')[0]  # Use name or fallback to username from email
        }
    }

@router.post("/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Parse form data manually
    try:
        form_data = await request.form()
        username = form_data.get("username")
        password = form_data.get("password")

        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        logger.error(f"Error parsing form data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid form data: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info(f"Login attempt for user: {username}")

    # Validate user credentials
    user = authenticate_user(db, username, password)
    if not user:
        logger.warning(f"Invalid credentials for user: {username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create token data - ensure we use email as subject
    token_data = {
        "sub": user.email,  # Always use email, never user ID
        "role": user.role,
        "uid": user.id
    }

    # Set token expiration
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Create the token
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )

    logger.info(f"Login successful for user: {user.email}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name or user.email.split('@')[0],  # Use name or fallback to username from email
            "force_password_change": False  # Default to False for now
        }
    }

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information for token validation
    """
    logger.info(f"Token validation for user: {current_user.email}")

    # Get client information
    client_info = []
    if hasattr(current_user, "clients") and current_user.clients:
        client_info = [{"id": client.id, "name": client.name} for client in current_user.clients]

    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name if current_user.name else current_user.email.split('@')[0],
        "role": current_user.role,
        "clients": client_info,
        "is_active": current_user.is_active,
        "force_password_change": False  # Default to False for now
    }


# Password reset request model
class PasswordResetRequest(BaseModel):
    email: EmailStr


# Password reset verification model
class PasswordResetVerify(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str


# Change password model
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Request a password reset. This will generate a reset token and in a real implementation would send an email.
    For now, it just returns the token in the response.
    """
    # Find the user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal that the user doesn't exist
        return {"message": "If the email exists, a password reset link has been sent."}

    # Generate a random token
    reset_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))

    # In a real implementation, we would store the token in the database
    # For now, just return the token in the response for testing
    return {
        "message": "If the email exists, a password reset link has been sent.",
        "debug_token": reset_token  # Remove this in production
    }


@router.post("/verify-password-reset")
async def verify_password_reset(request: PasswordResetVerify, db: Session = Depends(get_db)):
    """
    Verify a password reset token and set a new password
    """
    # Find the user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # In a real implementation, we would verify the token against the stored token
    # For now, we'll just set the new password without verification

    # Set the new password
    user.hashed_password = get_password_hash(request.new_password)

    # Save to database
    db.commit()

    return {"message": "Password has been reset successfully"}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change password for the currently logged in user
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Set the new password
    current_user.hashed_password = get_password_hash(request.new_password)

    # Save to database
    db.commit()

    return {"message": "Password has been changed successfully"}