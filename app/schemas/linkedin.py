from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class ProfileResponse(BaseModel):
    id: str
    firstName: str
    lastName: str
    profilePicture: Optional[str] = None
    emailAddress: Optional[str] = None

class CampaignResponse(BaseModel):
    id: str
    name: str
    status: str
    type: str
    dailyBudget: Optional[float] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None

class MetricData(BaseModel):
    date: datetime
    impressions: int
    clicks: int
    spend: float
    conversions: int

class CampaignMetricsResponse(BaseModel):
    elements: List[MetricData]
    paging: Optional[dict] = None 