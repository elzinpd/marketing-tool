from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User
from app.schemas.auth import UserCreate, UserResponse, Token, OAuthCallbackResponse
from app.services.linkedin_service import LinkedInService
from app.services.rollworks_service import RollworksService
from typing import Optional
from app.crud import crud_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
linkedin_service = LinkedInService()
rollworks_service = RollworksService()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud_user.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(crud_user.get_current_user)):
    return current_user

@router.get("/linkedin/auth")
def get_linkedin_auth_url(redirect_uri: str, state: Optional[str] = None):
    """Generate LinkedIn OAuth2 authorization URL"""
    try:
        auth_url = linkedin_service.get_auth_url(redirect_uri, state)
        return {"auth_url": auth_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/rollworks/auth")
def get_rollworks_auth_url(redirect_uri: str, state: Optional[str] = None):
    """Generate Rollworks OAuth2 authorization URL"""
    try:
        auth_url = rollworks_service.get_auth_url(redirect_uri, state)
        return {"auth_url": auth_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/callback", response_model=OAuthCallbackResponse)
async def oauth_callback(
    code: str,
    state: Optional[str] = None,
    provider: str = "linkedin",
    db: Session = Depends(get_db)
):
    try:
        # Exchange code for access token
        if provider == "linkedin":
            token_data = linkedin_service.exchange_code_for_token(code, settings.LINKEDIN_REDIRECT_URI)
            profile = linkedin_service.get_profile(token_data["access_token"])
            email = profile.get("email")
            name = f"{profile.get('firstName', '')} {profile.get('lastName', '')}".strip()
        elif provider == "rollworks":
            token_data = rollworks_service.exchange_code_for_token(code, settings.ROLLWORKS_REDIRECT_URI)
            profile = rollworks_service.get_profile(token_data["access_token"])
            email = profile.get("email")
            name = profile.get("name", "")
        else:
            raise HTTPException(status_code=400, detail="Unsupported OAuth provider")

        # Create or update user
        user = crud_user.get_user_by_email(db, email=email)
        if not user:
            user = crud_user.create_user(
                db=db,
                user=UserCreate(
                    email=email,
                    full_name=name,
                    password="",  # OAuth users don't need a password
                    is_active=True
                )
            )

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "provider": provider,
            "profile": profile
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 