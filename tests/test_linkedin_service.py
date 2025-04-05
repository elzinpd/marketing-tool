import pytest
from unittest.mock import patch, MagicMock
from app.services.linkedin_service import LinkedInService
from app.core.config import settings

@pytest.fixture
def linkedin_service():
    return LinkedInService()

def test_get_profile(linkedin_service):
    # Mock the requests.get method
    with patch('requests.get') as mock_get:
        # Configure the mock
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "id": "test_id",
            "firstName": "Test",
            "lastName": "User"
        }
        mock_get.return_value = mock_response

        # Call the method
        result = linkedin_service.get_profile(settings.LINKEDIN_ACCESS_TOKEN)

        # Assert the results
        assert result["id"] == "test_id"
        assert result["firstName"] == "Test"
        assert result["lastName"] == "User"

def test_get_campaigns(linkedin_service):
    with patch('requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "elements": [
                {
                    "id": "campaign_1",
                    "name": "Test Campaign",
                    "status": "ACTIVE"
                }
            ]
        }
        mock_get.return_value = mock_response

        result = linkedin_service.get_campaigns(settings.LINKEDIN_ACCESS_TOKEN)

        assert len(result) == 1
        assert result[0]["id"] == "campaign_1"
        assert result[0]["name"] == "Test Campaign"

def test_get_campaign_metrics(linkedin_service):
    with patch('requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "impressions": 1000,
            "clicks": 100,
            "spend": 50.0
        }
        mock_get.return_value = mock_response

        result = linkedin_service.get_campaign_metrics(
            settings.LINKEDIN_ACCESS_TOKEN,
            "campaign_1"
        )

        assert result["impressions"] == 1000
        assert result["clicks"] == 100
        assert result["spend"] == 50.0 