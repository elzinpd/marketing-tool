from typing import Optional, List, Dict, Any
from app.core.config import settings
import requests
import logging

logger = logging.getLogger(__name__)

class LinkedInService:
    def __init__(self):
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.base_url = "https://api.linkedin.com/v2"
        self.auth_url = "https://www.linkedin.com/oauth/v2"

    def get_auth_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        """Generate LinkedIn OAuth2 authorization URL"""
        if not self.client_id:
            raise ValueError("LinkedIn client ID not configured")
        
        auth_url = f"{self.auth_url}/authorization"
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": "r_liteprofile r_emailaddress w_member_social"
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
            logger.error(f"Failed to exchange code for token: {str(e)}")
            raise

    def get_profile(self, access_token: str) -> Dict[str, Any]:
        """Get user's LinkedIn profile"""
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "cache-control": "no-cache",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Get basic profile info
            profile_response = requests.get(
                f"{self.base_url}/me",
                headers=headers
            )
            profile_response.raise_for_status()
            profile = profile_response.json()
            
            # Get email address
            email_response = requests.get(
                f"{self.base_url}/emailAddress?q=members&projection=(elements*(handle~))",
                headers=headers
            )
            email_response.raise_for_status()
            email_data = email_response.json()
            
            # Combine profile and email data
            profile["email"] = email_data.get("elements", [{}])[0].get("handle~", {}).get("emailAddress")
            
            return profile
        except Exception as e:
            logger.error(f"Failed to get profile: {str(e)}")
            raise

    def get_campaigns(self, access_token: str) -> List[Dict[str, Any]]:
        """Get LinkedIn ad campaigns"""
        if not self.client_id:
            logger.warning("LinkedIn client ID not configured. Returning empty campaigns list.")
            return []
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "cache-control": "no-cache",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            campaigns_response = requests.get(
                f"{self.base_url}/adCampaigns",
                headers=headers
            )
            campaigns_response.raise_for_status()
            campaigns = campaigns_response.json().get("elements", [])
            return campaigns
        except Exception as e:
            logger.error(f"Failed to get campaigns: {str(e)}")
            return []

    def get_campaign_metrics(self, access_token: str, campaign_id: str) -> Dict[str, Any]:
        """Get metrics for a specific campaign"""
        if not self.client_id:
            logger.warning("LinkedIn client ID not configured. Returning empty metrics.")
            return {}
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "cache-control": "no-cache",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            metrics_response = requests.get(
                f"{self.base_url}/adCampaigns/{campaign_id}/metrics",
                headers=headers
            )
            metrics_response.raise_for_status()
            metrics = metrics_response.json()
            return metrics
        except Exception as e:
            logger.error(f"Failed to get campaign metrics: {str(e)}")
            return {}

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
            profile = self.get_profile(access_token)
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