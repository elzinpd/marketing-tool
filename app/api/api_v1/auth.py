from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from app.core.config import settings
import requests

router = APIRouter()

@router.get("/callback")
async def oauth_callback(request: Request):
    """Handle OAuth callback from Rollworks"""
    try:
        # Get the authorization code from the callback
        code = request.query_params.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code not found")

        # Exchange the code for an access token
        token_response = requests.post(
            "https://api.nextroll.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.ROLLWORKS_CLIENT_ID,
                "client_secret": settings.ROLLWORKS_CLIENT_SECRET,
                "redirect_uri": f"{settings.API_V1_STR}/auth/callback"
            },
            timeout=30
        )
        token_response.raise_for_status()
        token_data = token_response.json()

        # Store the access token (in a real app, you'd store this securely)
        settings.ROLLWORKS_ACCESS_TOKEN = token_data["access_token"]
        settings.ROLLWORKS_REFRESH_TOKEN = token_data.get("refresh_token")

        # Redirect to the dashboard or appropriate page
        return RedirectResponse(url="/dashboard")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))