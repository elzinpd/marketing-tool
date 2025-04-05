from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import RequestValidationError
from app.core.config import settings, get_settings
from app.api.api import api_router
from app.core.error_handlers import (
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from app.db.init_db import init_db
from fastapi.responses import JSONResponse

# Explicitly import the reports router to ensure it's registered
from app.api.api_v1.endpoints.reports import router as reports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for tracking marketing campaigns, budgets, and generating reports",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configure CORS - use * to allow all origins during development
# This is a more permissive setting for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"]  # Expose all headers
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # In production, replace with your domain
)

# Add exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Make sure we explicitly include the reports router with the correct prefix
# This is a critical fix to resolve 404 errors
app.include_router(
    reports_router, 
    prefix=f"{settings.API_V1_STR}/reports", 
    tags=["reports"]
)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

@app.get("/test-cors", tags=["test"])
async def test_cors():
    """
    Simple endpoint to test if CORS is working
    """
    return JSONResponse(content={"status": "ok"})

# Log all available routes for debugging
@app.on_event("startup")
async def log_routes():
    routes = []
    for route in app.routes:
        routes.append(f"{route.path} - {route.methods}")
    print("=== AVAILABLE ROUTES ===")
    for route in sorted(routes):
        print(route)
    print("=======================")

# Initialize the database on startup
@app.on_event("startup")
def startup_db_client():
    init_db() 