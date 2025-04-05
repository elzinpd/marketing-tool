from typing import Optional, List, Dict, Any
from app.core.config import settings
import requests
import logging
import json
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import User, Client, Campaign, CampaignMetric
from app.core.auth import get_current_user
import httpx

logger = logging.getLogger(__name__)

class LinkedInService:
    def __init__(self):
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.base_url = "https://api.linkedin.com/v2"
        self.auth_url = "https://www.linkedin.com/oauth/v2"
        self.access_token = settings.LINKEDIN_ACCESS_TOKEN

    def _get_headers(self, access_token: str) -> Dict[str, str]:
        """Get common headers for LinkedIn API requests"""
        return {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
            "cache-control": "no-cache",
            "LinkedIn-Version": "202401"
        }

    def _handle_error_response(self, response: requests.Response) -> None:
        """Handle error responses from LinkedIn API"""
        try:
            error_data = response.json()
            logger.error(f"LinkedIn API Error: Status {response.status_code}")
            logger.error(f"Response Headers: {json.dumps(dict(response.headers), indent=2)}")
            logger.error(f"Response Body: {json.dumps(error_data, indent=2)}")
        except Exception as e:
            logger.error(f"Failed to parse error response: {str(e)}")
            logger.error(f"Raw Response: {response.text}")
        response.raise_for_status()

    async def verify_token(self) -> bool:
        """Verify if the access token is valid"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.linkedin.com/v2/userinfo",
                    headers=self._get_headers(self.access_token)
                )
                if response.status_code != 200:
                    self._handle_error_response(response)
                    return False
                return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired access token: {str(e)}"
            )

    def get_auth_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        """Generate LinkedIn OAuth2 authorization URL"""
        if not self.client_id:
            raise ValueError("LinkedIn client ID not configured")
        
        auth_url = f"{self.auth_url}/authorization"
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": "r_liteprofile r_emailaddress w_member_social ads_management"
        }
        if state:
            params["state"] = state
            
        return f"{auth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

    def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        if not self.client_id or not self.client_secret:
            raise ValueError("LinkedIn client credentials not configured")
        
        try:
            response = requests.post(
                f"{self.auth_url}/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error exchanging code for token: {str(e)}")
            raise

    async def get_profile(self) -> Dict[str, Any]:
        """Get LinkedIn profile information"""
        if not await self.verify_token():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token"
            )

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/me",
                headers=self._get_headers(self.access_token)
            )
            
            if response.status_code != 200:
                self._handle_error_response(response)
            
            return response.json()

    async def get_campaigns(self) -> Dict[str, Any]:
        """Get LinkedIn campaigns"""
        if not await self.verify_token():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token"
            )

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/adAccounts",
                headers=self._get_headers(self.access_token)
            )
            
            if response.status_code != 200:
                self._handle_error_response(response)
            
            return response.json()

    async def get_campaign_metrics(self, campaign_id: str) -> Dict[str, Any]:
        """Get metrics for a specific campaign"""
        if not await self.verify_token():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token"
            )

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/adAnalytics?campaigns[0]=urn:li:sponsoredCampaign:{campaign_id}",
                headers=self._get_headers(self.access_token)
            )
            
            if response.status_code != 200:
                self._handle_error_response(response)
            
            return response.json()

    async def get_account_metrics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Fetch account-level metrics"""
        if not self.client_id:
            logger.warning("LinkedIn client ID not configured")
            return {}
        try:
            headers = {
                "Authorization": f"Bearer {self.client_id}",
                "cache-control": "no-cache",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            metrics_response = requests.get(
                f"{self.base_url}/account/metrics",
                headers=headers
            )
            metrics_response.raise_for_status()
            metrics = metrics_response.json()
            return metrics
        except Exception as e:
            logger.error(f"Error fetching LinkedIn account metrics: {str(e)}")
            return {}

    async def get_budget_utilization(self) -> Dict[str, Any]:
        """Fetch budget utilization metrics"""
        if not self.client_id:
            logger.warning("LinkedIn client ID not configured")
            return {}
        try:
            headers = {
                "Authorization": f"Bearer {self.client_id}",
                "cache-control": "no-cache",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            utilization_response = requests.get(
                f"{self.base_url}/account/budgetUtilization",
                headers=headers
            )
            utilization_response.raise_for_status()
            utilization = utilization_response.json()
            return utilization
        except Exception as e:
            logger.error(f"Error fetching LinkedIn budget utilization: {str(e)}")
            return {}

    def share_post(self, access_token: str, content: str) -> Dict[str, Any]:
        """Share a post on LinkedIn"""
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json"
            }
            
            # First get the user's URN
            profile = self.get_profile()
            author_urn = f"urn:li:person:{profile['id']}"
            
            # Create the post
            post_data = {
                "author": author_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": content
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            response = requests.post(
                f"{self.base_url}/ugcPosts",
                headers=headers,
                json=post_data
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to share post: {str(e)}")
            raise

    def sync_campaigns(self, user: User, db: Session) -> None:
        """Sync LinkedIn campaigns with local database"""
        campaigns = self.get_campaigns()
        
        for campaign_data in campaigns.get("elements", []):
            campaign_name = campaign_data.get("name", "")
            if not can_access_campaign(user, campaign_name, db):
                continue
                
            # Find or create campaign
            campaign = db.query(Campaign).filter(
                Campaign.name == campaign_name
            ).first()
            
            if not campaign:
                # Find client based on campaign keywords
                client = None
                for db_client in db.query(Client).all():
                    keywords = [k.strip() for k in db_client.campaign_keywords.split(",")]
                    if any(keyword.lower() in campaign_name.lower() for keyword in keywords):
                        client = db_client
                        break
                
                if not client:
                    continue
                
                campaign = Campaign(
                    name=campaign_name,
                    platform="linkedin",
                    client_id=client.id
                )
                db.add(campaign)
                db.commit()
                db.refresh(campaign)
            
            # Update campaign metrics
            metrics = self.get_campaign_metrics(campaign_data.get("id"))
            
            for metric_data in metrics.get("elements", []):
                metric = CampaignMetric(
                    campaign_id=campaign.id,
                    date=metric_data.get("date"),
                    impressions=metric_data.get("impressions", 0),
                    clicks=metric_data.get("clicks", 0),
                    spend=metric_data.get("spend", 0),
                    conversions=metric_data.get("conversions", 0)
                )
                db.add(metric)
            
            db.commit() 