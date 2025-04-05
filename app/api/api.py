from fastapi import APIRouter

# Import directly from v1 endpoints instead of using the try/except
from app.api.api_v1.endpoints import auth, clients, users, linkedin, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(linkedin.router, prefix="/linkedin", tags=["linkedin"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"]) 