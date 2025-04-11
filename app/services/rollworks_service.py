import requests
from app.core.config import settings
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class CampaignReport(BaseModel):
    campaign_id: str
    impressions: int
    clicks: int
    spend: float
    conversions: int
    date: datetime

class RollworksService:
    def __init__(self):
        self.api_key = settings.ROLLWORKS_API_KEY
        self.base_url = "https://api.rollworks.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}" if self.api_key else None,
            "Content-Type": "application/json"
        }

    def get_auth_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        """Generate Rollworks OAuth2 authorization URL"""
        if not self.api_key:
            raise ValueError("Rollworks API key not configured")

        auth_url = f"{self.base_url}/oauth/authorize"
        params = {
            "client_id": self.api_key,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "read write"
        }
        if state:
            params["state"] = state

        return f"{auth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

    def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        if not self.api_key:
            raise ValueError("Rollworks API key not configured")

        try:
            response = requests.post(
                f"{self.base_url}/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": self.api_key
                },
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to exchange code for token: {str(e)}")
            raise

    def get_profile(self, access_token: str) -> Dict[str, Any]:
        """Get user's Rollworks profile"""
        try:
            response = requests.get(
                f"{self.base_url}/me",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get profile: {str(e)}")
            raise

    def get_campaigns(self, access_token: str) -> List[Dict[str, Any]]:
        """Get Rollworks campaigns"""
        if not self.api_key:
            logger.warning("Rollworks API key not configured. Returning empty campaigns list.")
            return []

        try:
            response = requests.get(
                f"{self.base_url}/campaigns",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30
            )
            response.raise_for_status()
            return response.json().get("data", [])
        except Exception as e:
            logger.error(f"Failed to get campaigns: {str(e)}")
            return []

    def get_campaign_metrics(self, access_token: str, campaign_id: str) -> Dict[str, Any]:
        """Get metrics for a specific campaign"""
        if not self.api_key:
            logger.warning("Rollworks API key not configured. Returning empty metrics.")
            return {}

        try:
            response = requests.get(
                f"{self.base_url}/campaigns/{campaign_id}/metrics",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get campaign metrics: {str(e)}")
            return {}

    def _make_request(self, method: str, endpoint: str, params: Optional[Dict] = None, data: Optional[Dict] = None) -> Dict:
        """Make an authenticated request to the Rollworks API"""
        if not self.api_key:
            raise ValueError("Rollworks API key not configured")

        try:
            response = requests.request(
                method,
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                params=params,
                json=data
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                logger.error("Invalid Rollworks API key")
                raise ValueError("Invalid Rollworks API key")
            elif e.response.status_code == 404:
                logger.error(f"Resource not found: {endpoint}")
                raise ValueError(f"Resource not found: {endpoint}")
            else:
                logger.error(f"API request failed: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Error making API request: {str(e)}")
            raise

    async def get_campaign_report(
        self,
        campaign_id: str,
        start_date: str,
        end_date: str,
        metrics: List[str] = ["impressions", "clicks", "spend", "conversions"]
    ) -> List[CampaignReport]:
        """Fetch detailed report for a specific campaign"""
        try:
            response = self._make_request(
                "GET",
                f"/campaigns/{campaign_id}/report",
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "metrics": ",".join(metrics)
                }
            )

            reports = []
            for data in response.get("data", []):
                try:
                    report = CampaignReport(
                        campaign_id=campaign_id,
                        impressions=data.get("impressions", 0),
                        clicks=data.get("clicks", 0),
                        spend=data.get("spend", 0.0),
                        conversions=data.get("conversions", 0),
                        date=datetime.fromisoformat(data["date"])
                    )
                    reports.append(report)
                except Exception as e:
                    logger.error(f"Error parsing report data: {str(e)}")
                    continue

            return reports
        except Exception as e:
            logger.error(f"Error fetching campaign report: {str(e)}")
            return []

    async def get_account_metrics(
        self,
        start_date: str,
        end_date: str,
        metrics: List[str] = ["impressions", "clicks", "spend", "conversions"]
    ) -> Dict[str, Any]:
        """Fetch account-level metrics"""
        try:
            response = self._make_request(
                "GET",
                "/account/metrics",
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "metrics": ",".join(metrics)
                }
            )
            return response.get("data", {})
        except Exception as e:
            logger.error(f"Error fetching account metrics: {str(e)}")
            return {}

    async def get_budget_utilization(self, campaign_id: str) -> Dict[str, Any]:
        """Fetch budget utilization for a campaign"""
        try:
            response = self._make_request(
                "GET",
                f"/campaigns/{campaign_id}/budget"
            )
            return response.get("data", {})
        except Exception as e:
            logger.error(f"Error fetching budget utilization: {str(e)}")
            return {}