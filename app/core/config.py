from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv
import os
from functools import lru_cache

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Marketing Tool"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # LinkedIn API Configuration
    LINKEDIN_CLIENT_ID: Optional[str] = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET: Optional[str] = os.getenv("LINKEDIN_CLIENT_SECRET")
    LINKEDIN_REDIRECT_URI: Optional[str] = os.getenv("LINKEDIN_REDIRECT_URI")
    
    # Rollworks API Configuration
    ROLLWORKS_API_KEY: Optional[str] = os.getenv("ROLLWORKS_API_KEY")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./marketing_tool.db")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings() 