from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.db import models
from app.services.linkedin_service import LinkedInService
from app.services.rollworks_service import RollworksService
from pydantic import BaseModel

# Create the main API router
api_router = APIRouter()

# Initialize services
linkedin_service = LinkedInService()
rollworks_service = RollworksService()

# Import endpoint modules
from app.api.api_v1.endpoints import auth, clients, users, linkedin, reports

# Register standard routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(linkedin.router, prefix="/linkedin", tags=["LinkedIn"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])

# Campaign models
class CampaignBase(BaseModel):
    name: str
    platform: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    total_budget: float
    client_id: int

class CampaignCreate(CampaignBase):
    pass

class Campaign(CampaignBase):
    id: int
    spent_budget: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Campaign endpoints
@api_router.get("/campaigns/", response_model=List[Campaign])
async def get_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    campaigns = db.query(models.Campaign).offset(skip).limit(limit).all()
    return campaigns

@api_router.post("/campaigns/", response_model=Campaign)
async def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db)
):
    db_campaign = models.Campaign(**campaign.dict())
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@api_router.get("/campaigns/{campaign_id}", response_model=Campaign)
async def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@api_router.get("/campaigns/{campaign_id}/metrics")
async def get_campaign_metrics(
    campaign_id: int,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db)
):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    metrics = db.query(models.CampaignMetric).filter(
        models.CampaignMetric.campaign_id == campaign_id,
        models.CampaignMetric.date >= start_date,
        models.CampaignMetric.date <= end_date
    ).all()
    
    return metrics 