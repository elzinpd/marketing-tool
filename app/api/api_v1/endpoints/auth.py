from datetime import timedelta, datetime
from typing import Any, Dict, Optional, List
import hashlib
import logging
from jose import jwt
from pydantic import BaseModel
from passlib.context import CryptContext

from fastapi import APIRouter, Depends, HTTPException, status
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

def simple_verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using SHA-256 (for test users only)"""
    try:
        password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        result = password_hash == hashed_password
        if result:
            logger.info("Password verified using SHA-256")
        else:
            logger.warning("SHA-256 password verification failed")
        return result
    except Exception as e:
        logger.error(f"Error in simple_verify_password: {e}")
        return False

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    logger.info(f"Login attempt for user: {form_data.username}")
    
    # Validate user credentials
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Invalid credentials for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token data - ensure we use email as subject
    token_data = {
        "sub": user.email,  # Always use email, never user ID
        "role": user.role,
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
            "name": user.name
        }
    }

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a new JWT access token with proper claims"""
    to_encode = data.copy()
    
    # Set proper expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire.timestamp()})
    
    # Log token creation details (without sensitive data)
    logger.debug(f"Creating token for user: {to_encode.get('sub')} with exp: {expire.isoformat()}")
    
    # Create JWT token
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

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
        "clients": client_info
    }

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Verify username and password
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.warning(f"User not found: {email}")
        return None
    
    # Check if password is a SHA-256 hash (64 chars) for test users
    password_verified = False
    if user.hashed_password and len(user.hashed_password) == 64:
        logger.info(f"Detected SHA-256 hash for user {user.email}, using simple verification")
        password_verified = simple_verify_password(password, user.hashed_password)
    
    # If not verified with simple method, try standard verification
    if not password_verified and user.hashed_password:
        try:
            password_verified = verify_password(password, user.hashed_password)
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            password_verified = False
    
    if not password_verified:
        logger.warning(f"Password verification failed for user: {email}")
        return None
    
    return user 

# Verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Hash password
def get_password_hash(password):
    return pwd_context.hash(password)

# Authenticate user
def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.email == username).first()
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

# Get current user
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# Get current active user
async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current user info from token
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role
    } 