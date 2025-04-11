import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import SQLAlchemyError

# Try to import Prometheus, but make it optional
try:
    from prometheus_fastapi_instrumentator import Instrumentator

    has_prometheus = True
except ImportError:
    has_prometheus = False
    print(
        "Warning: prometheus_fastapi_instrumentator not installed. Metrics will be disabled."
    )

from app.core.config import settings, get_settings
from app.core.error_handlers import (
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler,
)
from app.core.logging import setup_logging, RequestLoggingMiddleware, get_logger
from app.api.api import api_router
from app.db.init_db import init_db

# Explicitly import the reports router to ensure it's registered
from app.api.api_v1.endpoints.reports import router as reports_router

# Set up structured logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services
    logger.info("Starting application")
    init_db()

    # Log all available routes for debugging
    routes = []
    for route in app.routes:
        routes.append(f"{route.path} - {route.methods}")

    logger.info("Available routes:", routes=routes)
    print("=== AVAILABLE ROUTES ===")
    for route in sorted(routes):
        print(route)
    print("=======================")

    yield

    # Shutdown: Clean up resources
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for tracking marketing campaigns, budgets, and generating reports",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS - specify frontend origin for requests with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Development frontend
        "http://localhost:5177",  # Alternative development port
        "http://localhost:3000",  # Another common development port
        "https://marketing-tool-frontend.vercel.app",  # Production frontend
        "https://marketing-tool-ed4e.vercel.app",  # Your actual frontend domain
        "https://marketing-tool-omega.vercel.app",  # Your actual backend domain
        (
            settings.FRONTEND_URL if hasattr(settings, "FRONTEND_URL") else ""
        ),  # Production frontend from settings
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=[
        "Content-Disposition"
    ],  # Expose Content-Disposition for file downloads
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],  # In production, replace with your domain
)

# Add exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Set up Prometheus metrics if available
if has_prometheus:
    try:
        Instrumentator().instrument(app).expose(app)
        logger.info("Prometheus metrics enabled at /metrics")
    except Exception as e:
        logger.warning(f"Failed to set up Prometheus metrics: {e}")
else:
    logger.warning("Prometheus metrics disabled - package not installed")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# NOTE: The reports router is already included in api_router
# Keeping this comment as a reminder that it was previously included twice


# Add health check endpoint
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "API is running"}


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


# Note: Startup events have been moved to the lifespan context manager
