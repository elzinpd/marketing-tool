import pytest
import logging
from app.services.linkedin_service import LinkedInService
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_live_profile_api():
    """Test the LinkedIn API with a real access token"""
    linkedin_service = LinkedInService()
    
    try:
        logger.info("Testing LinkedIn profile API...")
        logger.info(f"Using token: {settings.LINKEDIN_ACCESS_TOKEN[:10]}...")
        profile = linkedin_service.get_profile(settings.LINKEDIN_ACCESS_TOKEN)
        print("\nProfile data:", profile)
        assert profile is not None
        assert "id" in profile
    except Exception as e:
        pytest.fail(f"Failed to get profile: {str(e)}")

@pytest.mark.skip(reason="Only run manually to test live LinkedIn API")
def test_live_campaigns_api():
    """Test the LinkedIn Campaigns API with a real access token"""
    linkedin_service = LinkedInService()
    
    try:
        campaigns = linkedin_service.get_campaigns(settings.LINKEDIN_ACCESS_TOKEN)
        print("\nCampaigns data:", campaigns)
        assert campaigns is not None
        assert isinstance(campaigns, list)
    except Exception as e:
        pytest.fail(f"Failed to get campaigns: {str(e)}")

@pytest.mark.skip(reason="Only run manually to test live LinkedIn API")
def test_live_campaign_metrics():
    """Test the LinkedIn Campaign Metrics API with a real access token"""
    linkedin_service = LinkedInService()
    
    try:
        # First get a campaign ID
        campaigns = linkedin_service.get_campaigns(settings.LINKEDIN_ACCESS_TOKEN)
        if not campaigns:
            pytest.skip("No campaigns available to test metrics")
        
        campaign_id = campaigns[0]["id"]
        metrics = linkedin_service.get_campaign_metrics(
            settings.LINKEDIN_ACCESS_TOKEN,
            campaign_id
        )
        print("\nMetrics data:", metrics)
        assert metrics is not None
    except Exception as e:
        pytest.fail(f"Failed to get campaign metrics: {str(e)}") 