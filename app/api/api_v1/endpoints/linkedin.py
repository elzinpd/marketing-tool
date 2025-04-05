from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from app.db.models import User, Client
from app.api.deps import get_current_user
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import get_db
import random

router = APIRouter()

@router.get("/profile")
async def get_linkedin_profile(current_user: User = Depends(get_current_user)):
    """
    Get LinkedIn profile information
    """
    # This is a placeholder - will be implemented with actual LinkedIn service
    return {
        "profile": {
            "id": "linkedin123",
            "firstName": "Test",
            "lastName": "User",
            "email": current_user.email
        }
    }

@router.get("/campaigns")
def get_linkedin_campaigns(
    client_id: Optional[int] = None, 
    client_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get LinkedIn campaigns for a specific client
    This is a placeholder for LinkedIn campaigns data fetching
    It returns mock data for demonstration purposes
    """
    # If the client was specified, verify access
    if client_id:
        # Check if client exists
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client with ID {client_id} not found")
        
        # For non-admin users, check access to the client
        if current_user.role != "admin":
            user_client_ids = [c.id for c in current_user.clients]
            if client_id not in user_client_ids:
                raise HTTPException(status_code=403, detail="Not authorized to access this client")
    
        # Generate a deterministic set of campaigns based on client ID
        client_seed = client_id
        client_name_for_data = client.name
    elif client_name:
        # If only client_name is provided, use it directly
        client_seed = hash(client_name) % 1000  # Use a hash of the name for seed
        client_name_for_data = client_name
    else:
        # If no client specified, return empty list
        return []
    
    # Mock campaign data
    campaigns = []
    
    # Use client ID to seed the random generator for consistent results per client
    random.seed(client_seed)
    
    # Generate 5-10 campaigns
    num_campaigns = random.randint(5, 10)
    
    for i in range(num_campaigns):
        campaign_id = f"li_{client_seed}_{i}"
        
        # Generate realistic metrics
        impressions = random.randint(1000, 50000)
        clicks = random.randint(50, int(impressions * 0.1))  # 0-10% CTR
        conversions = random.randint(1, int(clicks * 0.2))  # 0-20% conversion rate
        spend = random.uniform(100, 5000)
        
        # Calculate derived metrics
        ctr = clicks / impressions if impressions > 0 else 0
        conversion_rate = conversions / clicks if clicks > 0 else 0
        cpc = spend / clicks if clicks > 0 else 0
        
        campaign = {
            "id": campaign_id,
            "name": f"{client_name_for_data} Campaign {i+1}",
            "platform": "LinkedIn",
            "status": random.choice(["Active", "Paused", "Completed"]),
            "startDate": (datetime.now() - timedelta(days=random.randint(30, 90))).strftime("%Y-%m-%d"),
            "endDate": (datetime.now() + timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d"),
            "budget": random.uniform(1000, 10000),
            "metrics": {
                "impressions": impressions,
                "clicks": clicks,
                "conversions": conversions,
                "spend": spend,
                "ctr": ctr,
                "conversionRate": conversion_rate,
                "cpc": cpc
            }
        }
        campaigns.append(campaign)
    
    return campaigns 