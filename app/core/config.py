from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from pydantic import field_validator
from dotenv import load_dotenv
import os
from functools import lru_cache
import secrets

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Marketing Tool API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # LinkedIn API Configuration
    LINKEDIN_ACCESS_TOKEN: Optional[str] = os.getenv("LINKEDIN_ACCESS_TOKEN")
    LINKEDIN_CLIENT_ID: Optional[str] = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET: Optional[str] = os.getenv("LINKEDIN_CLIENT_SECRET")
    LINKEDIN_REDIRECT_URI: Optional[str] = os.getenv("LINKEDIN_REDIRECT_URI")

    # Rollworks API Configuration
    ROLLWORKS_API_KEY: Optional[str] = os.getenv("ROLLWORKS_API_KEY")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./marketing_tool.db")

    # JWT Configuration
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    # SQLAlchemy settings
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./marketing_tool.db"

    # Backend CORS settings
    BACKEND_CORS_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")

    # Define reports directory
    REPORTS_DIRECTORY: str = os.getenv(
        "REPORTS_DIR",
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "reports"
        ),
    )

    SERVER_NAME: str = os.getenv("SERVER_NAME", "localhost")
    SERVER_HOST: str = os.getenv("SERVER_HOST", "http://localhost:8001")

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    class Config:
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
