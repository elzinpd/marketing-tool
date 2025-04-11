from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Path
from typing import List, Dict, Any, Optional
from app.db.models import User, Client, Campaign
from app.api.deps import get_current_user
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.linkedin_service import LinkedInService
import logging
import random

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize LinkedIn service
linkedin_service = LinkedInService()

@router.get("/profile")
async def get_linkedin_profile(current_user: User = Depends(get_current_user)):
    """
    Get LinkedIn profile information
    """
    try:
        profile = await linkedin_service.get_profile()
        return {
            "profile": profile
        }
    except Exception as e:
        logger.error(f"Error getting LinkedIn profile: {str(e)}")
        # Fallback to mock data if API fails
        return {
            "profile": {
                "id": "linkedin123",
                "firstName": "Test",
                "lastName": "User",
                "email": current_user.email
            }
        }

@router.get("/campaigns")
async def get_linkedin_campaigns(
    client_id: Optional[int] = None,
    client_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get LinkedIn campaigns for a specific client

    Args:
        client_id: Optional client ID to filter campaigns
        client_name: Optional client name to filter campaigns
        start_date: Optional start date for metrics (YYYY-MM-DD)
        end_date: Optional end date for metrics (YYYY-MM-DD)
    """
    # If the client was specified, verify access
    if client_id:
        # Check if client exists
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client with ID {client_id} not found")

        # For non-admin/owner users, check access to the client
        if current_user.role not in ["admin", "owner"]:
            user_client_ids = [c.id for c in current_user.clients]
            if client_id not in user_client_ids:
                raise HTTPException(status_code=403, detail="Not authorized to access this client")

        client_name_for_data = client.name
    elif client_name:
        # If only client_name is provided, check if user has access to clients with this name
        if current_user.role not in ["admin", "owner"]:
            # Get all clients the user has access to
            user_clients = current_user.clients
            # Check if any client matches the provided name
            client_match = False
            for client in user_clients:
                if client_name.lower() in client.name.lower():
                    client_match = True
                    break
            if not client_match:
                raise HTTPException(status_code=403, detail="Not authorized to access this client")

        client_name_for_data = client_name
    else:
        # If no client specified, for non-admin/owner users, return only campaigns for their clients
        if current_user.role not in ["admin", "owner"]:
            if not current_user.clients:
                return []
            # Use the first client for the user
            client = current_user.clients[0]
            client_name_for_data = client.name
        else:
            # Admin/owner can see all campaigns if no client is specified
            # But we'll still need a filter, so use an empty string to match all
            client_name_for_data = ""

    try:
        # Try to get real LinkedIn campaigns
        accounts = await linkedin_service.get_ad_accounts()

        if not accounts:
            logger.warning("No LinkedIn ad accounts found, using fallback data")
            return get_fallback_campaigns(client_id, client_name_for_data, current_user.role)

        # Get campaigns for the first account
        account_id = accounts[0].get('id')
        campaigns_data = await linkedin_service.get_campaigns(account_id)

        if not campaigns_data:
            logger.warning("No LinkedIn campaigns found, using fallback data")
            return get_fallback_campaigns(client_id, client_name_for_data, current_user.role)

        # Process campaigns and add metrics
        result = []
        for campaign in campaigns_data:
            campaign_id = campaign.get('id')
            if not campaign_id:
                continue

            # Get campaign metrics
            metrics = await linkedin_service.get_campaign_metrics(
                campaign_id, start_date, end_date
            )

            # Aggregate metrics
            impressions = sum(m.get('impressions', 0) for m in metrics)
            clicks = sum(m.get('clicks', 0) for m in metrics)
            conversions = sum(m.get('conversions', 0) for m in metrics)
            spend = sum(m.get('costInLocalCurrency', 0) for m in metrics)

            # Calculate derived metrics
            ctr = clicks / impressions if impressions > 0 else 0
            conversion_rate = conversions / clicks if clicks > 0 else 0
            cpc = spend / clicks if clicks > 0 else 0

            # Get campaign details
            name = campaign.get('name', f"Campaign {campaign_id}")
            status = campaign.get('status', 'UNKNOWN')

            # Get budget information
            budget = 0
            if 'dailyBudget' in campaign:
                budget = campaign.get('dailyBudget', {}).get('amount', 0)
            elif 'lifetime' in campaign:
                budget = campaign.get('lifetime', {}).get('amount', 0)

            # Get date information
            start_date_val = None
            end_date_val = None
            if 'runSchedule' in campaign:
                start_date_val = campaign.get('runSchedule', {}).get('start', None)
                end_date_val = campaign.get('runSchedule', {}).get('end', None)

            # Create campaign object with or without financial data based on user role
            campaign_obj = {
                "id": campaign_id,
                "name": name,
                "platform": "LinkedIn",
                "status": status,
                "startDate": start_date_val,
                "endDate": end_date_val,
                "metrics": {
                    "impressions": impressions,
                    "clicks": clicks,
                    "conversions": conversions,
                    "ctr": ctr,
                    "conversionRate": conversion_rate
                }
            }

            # Only include financial data for admin and owner roles
            if current_user.role in ["admin", "owner"]:
                campaign_obj["budget"] = budget
                campaign_obj["metrics"]["spend"] = spend
                campaign_obj["metrics"]["cpc"] = cpc

            # Check if campaign matches any of the client's keywords
            include_campaign = False

            if client_name_for_data == "":
                # Admin/owner with no client filter - include all campaigns
                include_campaign = True
            else:
                # Get client from database to access keywords
                client = db.query(Client).filter(Client.name == client_name_for_data).first()

                if client and client.campaign_keywords:
                    # Get keywords list
                    keywords = client.campaign_keywords_list

                    # Check if any keyword matches the campaign name
                    for keyword in keywords:
                        if keyword.lower() in name.lower():
                            include_campaign = True
                            break
                else:
                    # Fallback to client name if no keywords defined
                    if client_name_for_data.lower() in name.lower():
                        include_campaign = True

            if include_campaign:
                result.append(campaign_obj)

        if not result:
            logger.warning("No matching LinkedIn campaigns found, using fallback data")
            return get_fallback_campaigns(client_id, client_name_for_data, current_user.role)

        return result
    except Exception as e:
        logger.error(f"Error getting LinkedIn campaigns: {str(e)}")
        # Fallback to mock data if API fails
        return get_fallback_campaigns(client_id, client_name_for_data, current_user.role)


def get_fallback_campaigns(client_id: Optional[int] = None, client_name: Optional[str] = None, user_role: str = "user"):
    """Generate fallback campaign data when the API fails

    Args:
        client_id: Optional client ID to filter campaigns
        client_name: Optional client name to filter campaigns
        user_role: User role to determine access to financial data
    """
    # Mock campaign data
    campaigns = []

    # Use client ID or name to seed the random generator for consistent results
    client_seed = client_id if client_id else hash(client_name) % 1000
    client_name_for_data = client_name if client_name else f"Client {client_id}"

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

        # Create campaign object with basic metrics (non-financial)
        campaign = {
            "id": campaign_id,
            "name": f"{client_name_for_data} Campaign {i+1}",
            "platform": "LinkedIn",
            "status": random.choice(["Active", "Paused", "Completed"]),
            "startDate": (datetime.now() - timedelta(days=random.randint(30, 90))).strftime("%Y-%m-%d"),
            "endDate": (datetime.now() + timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d"),
            "accountId": "510178679",  # Specific ad account ID
            "metrics": {
                "impressions": impressions,
                "clicks": clicks,
                "conversions": conversions,
                "ctr": ctr,
                "conversionRate": conversion_rate
            }
        }

        # Only include financial data for admin and owner roles
        if user_role in ["admin", "owner"]:
            campaign["budget"] = random.uniform(1000, 10000)
            campaign["metrics"]["spend"] = spend
            campaign["metrics"]["cpc"] = cpc

        campaigns.append(campaign)

    return campaigns


@router.get("/analytics")
async def get_linkedin_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    client_id: Optional[int] = None,
    client_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get LinkedIn ad analytics

    Args:
        start_date: Optional start date for metrics (YYYY-MM-DD)
        end_date: Optional end date for metrics (YYYY-MM-DD)
        client_id: Optional client ID to filter analytics
        client_name: Optional client name to filter analytics
    """
    # Check client access if client_id is provided
    if client_id:
        # Check if client exists
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client with ID {client_id} not found")

        # For non-admin/owner users, check access to the client
        if current_user.role not in ["admin", "owner"]:
            user_client_ids = [c.id for c in current_user.clients]
            if client_id not in user_client_ids:
                raise HTTPException(status_code=403, detail="Not authorized to access this client")

        client_name_for_filter = client.name
    elif client_name:
        # If only client_name is provided, check if user has access to clients with this name
        if current_user.role not in ["admin", "owner"]:
            # Get all clients the user has access to
            user_clients = current_user.clients
            # Check if any client matches the provided name
            client_match = False
            for client in user_clients:
                if client_name.lower() in client.name.lower():
                    client_match = True
                    break
            if not client_match:
                raise HTTPException(status_code=403, detail="Not authorized to access this client")

        client_name_for_filter = client_name
    else:
        # If no client specified, for non-admin/owner users, return only analytics for their clients
        if current_user.role not in ["admin", "owner"]:
            if not current_user.clients:
                return []
            # Use the first client for the user
            client = current_user.clients[0]
            client_name_for_filter = client.name
        else:
            # Admin/owner can see all analytics if no client is specified
            client_name_for_filter = None

    try:
        # Get analytics data from LinkedIn API
        analytics = await linkedin_service.get_ad_analytics(None, start_date, end_date)

        # If analytics is empty, return fallback data
        if not analytics:
            return get_fallback_analytics(start_date, end_date, client_name_for_filter, current_user.role)

        # Filter analytics by client name if provided
        if client_name_for_filter:
            # We need to get campaigns to match analytics with client names
            campaigns_data = await linkedin_service.get_campaigns()

            # Create a mapping of campaign IDs to names
            campaign_names = {}
            for campaign in campaigns_data:
                campaign_id = campaign.get('id')
                if campaign_id:
                    campaign_names[campaign_id] = campaign.get('name', '')

            # Get client from database to access keywords
            client = db.query(Client).filter(Client.name == client_name_for_filter).first()
            client_keywords = []

            if client and client.campaign_keywords:
                client_keywords = client.campaign_keywords_list

            # Filter analytics by campaign name matching client keywords
            filtered_analytics = []
            for analytic in analytics:
                campaign_id = analytic.get('campaign', {}).get('id')
                if campaign_id and campaign_id in campaign_names:
                    campaign_name = campaign_names[campaign_id]

                    # Check if campaign matches any client keyword
                    include_analytic = False

                    if client_keywords:
                        # Check against keywords
                        for keyword in client_keywords:
                            if keyword.lower() in campaign_name.lower():
                                include_analytic = True
                                break
                    else:
                        # Fallback to client name if no keywords defined
                        if client_name_for_filter.lower() in campaign_name.lower():
                            include_analytic = True

                    if include_analytic:
                        # Remove financial data for non-admin/owner users
                        if current_user.role not in ["admin", "owner"]:
                            if "costInLocalCurrency" in analytic:
                                del analytic["costInLocalCurrency"]
                            if "costPerClick" in analytic:
                                del analytic["costPerClick"]
                            if "costPerConversion" in analytic:
                                del analytic["costPerConversion"]
                        filtered_analytics.append(analytic)

            return filtered_analytics
        else:
            # For admin/owner, return all analytics but still remove financial data for non-admin/owner
            if current_user.role not in ["admin", "owner"]:
                for analytic in analytics:
                    if "costInLocalCurrency" in analytic:
                        del analytic["costInLocalCurrency"]
                    if "costPerClick" in analytic:
                        del analytic["costPerClick"]
                    if "costPerConversion" in analytic:
                        del analytic["costPerConversion"]

            return analytics
    except Exception as e:
        logger.error(f"Error getting LinkedIn analytics: {str(e)}")
        # Return fallback data if API fails
        return get_fallback_analytics(start_date, end_date, client_name_for_filter, current_user.role)


def get_fallback_analytics(start_date: Optional[str] = None, end_date: Optional[str] = None, client_name: Optional[str] = None, user_role: str = "user"):
    """Generate fallback analytics data when the API fails

    Args:
        start_date: Optional start date for metrics (YYYY-MM-DD)
        end_date: Optional end date for metrics (YYYY-MM-DD)
        client_name: Optional client name to filter analytics
        user_role: User role to determine access to financial data
    """
    # Generate dates for the last 30 days if no date range is provided
    if not start_date:
        end_date_obj = datetime.now()
        start_date_obj = end_date_obj - timedelta(days=30)
    else:
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.now()

    # Generate daily metrics
    analytics = []
    current_date = start_date_obj

    # Seed random for consistent results
    # If client_name is provided, use it to seed for consistent client-specific data
    seed_value = 42
    if client_name:
        seed_value = hash(client_name) % 1000
    random.seed(seed_value)

    # Generate 2-5 campaigns if client_name is provided
    num_campaigns = 1
    if client_name:
        num_campaigns = random.randint(2, 5)

    # Generate campaign IDs and names
    campaigns = []
    for i in range(num_campaigns):
        campaign_id = f"li_{seed_value}_{i}"
        campaign_name = f"{client_name if client_name else 'Marketing Agency'} Campaign {i+1}"
        campaigns.append({"id": campaign_id, "name": campaign_name})

    while current_date <= end_date_obj:
        date_str = current_date.strftime("%Y-%m-%d")

        # For each campaign, generate metrics
        for campaign in campaigns:
            # Generate metrics with some randomness but trending upward over time
            day_factor = (current_date - start_date_obj).days / max(1, (end_date_obj - start_date_obj).days)
            base_impressions = 1000 + int(5000 * day_factor)
            base_clicks = 50 + int(200 * day_factor)

            impressions = random.randint(base_impressions - 500, base_impressions + 500)
            clicks = random.randint(base_clicks - 20, base_clicks + 20)
            spend = round(random.uniform(50, 200) * (1 + day_factor), 2)
            conversions = random.randint(1, max(1, int(clicks * 0.1)))

            # Create analytics entry with basic metrics (non-financial)
            analytics_entry = {
                "date": date_str,
                "campaign": {
                    "id": campaign["id"],
                    "name": campaign["name"]
                },
                "impressions": impressions,
                "clicks": clicks,
                "conversions": conversions,
                "ctr": round(clicks / impressions, 4) if impressions > 0 else 0
            }

            # Only include financial data for admin and owner roles
            if user_role in ["admin", "owner"]:
                analytics_entry["spend"] = spend
                analytics_entry["costPerClick"] = round(spend / clicks, 2) if clicks > 0 else 0
                analytics_entry["costPerConversion"] = round(spend / conversions, 2) if conversions > 0 else 0

            analytics.append(analytics_entry)

        current_date += timedelta(days=1)

    return analytics


def check_client_access(current_user: User, client_id: Optional[int] = None, client_name: Optional[str] = None, db: Session = None):
    """Helper function to check if a user has access to a client

    Args:
        current_user: The current user
        client_id: Optional client ID to check access
        client_name: Optional client name to check access
        db: Database session

    Returns:
        Tuple of (has_access, client_name_for_filter, client_keywords)

    Raises:
        HTTPException: If user doesn't have access to the client
    """
    # Admin and owner have access to all clients
    if current_user.role in ["admin", "owner"]:
        if client_id and db:
            # Check if client exists
            client = db.query(Client).filter(Client.id == client_id).first()
            if not client:
                raise HTTPException(status_code=404, detail=f"Client with ID {client_id} not found")
            keywords = client.campaign_keywords_list if client.campaign_keywords else []
            return True, client.name, keywords
        elif client_name and db:
            # Try to find client by name
            client = db.query(Client).filter(Client.name == client_name).first()
            if client:
                keywords = client.campaign_keywords_list if client.campaign_keywords else []
                return True, client.name, keywords
            return True, client_name, []
        else:
            return True, None, []

    # For non-admin/owner users, check access to the client
    if client_id and db:
        # Check if client exists
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client with ID {client_id} not found")

        # Check if user has access to the client
        user_client_ids = [c.id for c in current_user.clients]
        if client_id not in user_client_ids:
            raise HTTPException(status_code=403, detail="Not authorized to access this client")

        keywords = client.campaign_keywords_list if client.campaign_keywords else []
        return True, client.name, keywords
    elif client_name:
        # Check if user has access to any client with this name
        user_clients = current_user.clients
        client_match = False
        matched_client = None

        for client in user_clients:
            if client_name.lower() in client.name.lower():
                client_match = True
                matched_client = client
                break

        if not client_match:
            raise HTTPException(status_code=403, detail="Not authorized to access this client")

        keywords = matched_client.campaign_keywords_list if matched_client.campaign_keywords else []
        return True, client_name, keywords
    else:
        # If no client specified, for non-admin/owner users, return only data for their clients
        if not current_user.clients:
            return False, None, []

        # Use the first client for the user
        client = current_user.clients[0]
        keywords = client.campaign_keywords_list if client.campaign_keywords else []
        return True, client.name, keywords


@router.get("/accounts")
async def get_linkedin_accounts(current_user: User = Depends(get_current_user)):
    """
    Get LinkedIn ad accounts
    """
    try:
        # Get ad accounts from LinkedIn API
        accounts = await linkedin_service.get_ad_accounts()

        # If accounts is empty, return fallback data
        if not accounts:
            return get_fallback_accounts()

        return accounts
    except Exception as e:
        logger.error(f"Error getting LinkedIn accounts: {str(e)}")
        # Return fallback data if API fails
        return get_fallback_accounts()


def get_fallback_accounts():
    """Generate fallback account data when the API fails"""
    return [
        {
            "id": "510178679",
            "name": "Marketing Agency Account",
            "type": "BUSINESS",
            "status": "ACTIVE",
            "currency": "USD",
            "createdAt": "2024-01-15T00:00:00.000Z",
            "lastModifiedAt": "2025-03-01T00:00:00.000Z",
            "notificationType": "EMAIL",
            "reference": "MARKETING_AGENCY_2025",
            "version": {
                "versionTag": "3"
            }
        }
    ]


@router.get("/metrics/{campaign_id}")
async def get_campaign_metrics(
    campaign_id: str = Path(..., description="LinkedIn campaign ID"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get metrics for a specific LinkedIn campaign

    Args:
        campaign_id: LinkedIn campaign ID
        start_date: Optional start date for metrics (YYYY-MM-DD)
        end_date: Optional end date for metrics (YYYY-MM-DD)
    """
    try:
        # First get the campaign to check if user has access to it
        campaigns_data = await linkedin_service.get_campaigns()
        campaign_found = False
        campaign_name = ""

        for campaign in campaigns_data:
            if campaign.get('id') == campaign_id:
                campaign_found = True
                campaign_name = campaign.get('name', '')
                break

        if not campaign_found:
            # Try to get the campaign directly
            try:
                campaign = await linkedin_service.get_campaign(campaign_id)
                if campaign:
                    campaign_found = True
                    campaign_name = campaign.get('name', '')
            except Exception:
                pass

        # If campaign is found, check if user has access to it based on client keywords
        if campaign_found and campaign_name and current_user.role not in ["admin", "owner"]:
            # Get all clients the user has access to
            user_clients = current_user.clients
            client_match = False

            for client in user_clients:
                # Check if any client keyword matches the campaign name
                if client.campaign_keywords:
                    keywords = client.campaign_keywords_list
                    for keyword in keywords:
                        if keyword.lower() in campaign_name.lower():
                            client_match = True
                            break
                    if client_match:
                        break
                # Fallback to client name if no keywords defined
                elif client.name.lower() in campaign_name.lower():
                    client_match = True
                    break

            if not client_match:
                raise HTTPException(status_code=403, detail="Not authorized to access this campaign")

        # Get campaign metrics from LinkedIn API
        metrics = await linkedin_service.get_campaign_metrics(campaign_id, start_date, end_date)

        # Remove financial data for non-admin/owner users
        if current_user.role not in ["admin", "owner"]:
            for metric in metrics:
                if "costInLocalCurrency" in metric:
                    del metric["costInLocalCurrency"]
                if "costPerClick" in metric:
                    del metric["costPerClick"]
                if "costPerConversion" in metric:
                    del metric["costPerConversion"]

        return metrics
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting LinkedIn campaign metrics: {str(e)}")
        # Return empty list if API fails
        return []


@router.get("/creatives")
async def get_linkedin_creatives(current_user: User = Depends(get_current_user)):
    """
    Get LinkedIn ad creatives
    """
    try:
        # Get creatives from LinkedIn API
        creatives = await linkedin_service.get_creatives()
        return creatives
    except Exception as e:
        logger.error(f"Error getting LinkedIn creatives: {str(e)}")
        # Return empty list if API fails
        return []


@router.get("/creatives/{creative_id}")
async def get_linkedin_creative(
    creative_id: str = Path(..., description="LinkedIn creative ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific LinkedIn creative

    Args:
        creative_id: LinkedIn creative ID
    """
    try:
        # Get creative from LinkedIn API
        creative = await linkedin_service.get_creative(None, creative_id)
        return creative
    except Exception as e:
        logger.error(f"Error getting LinkedIn creative: {str(e)}")
        # Return empty dict if API fails
        return {}


@router.get("/experiments")
async def get_linkedin_experiments(current_user: User = Depends(get_current_user)):
    """
    Get LinkedIn ad experiments
    """
    try:
        # Get experiments from LinkedIn API
        experiments = await linkedin_service.get_experiments()
        return experiments
    except Exception as e:
        logger.error(f"Error getting LinkedIn experiments: {str(e)}")
        # Return empty list if API fails
        return []


@router.get("/experiments/{experiment_id}")
async def get_linkedin_experiment(
    experiment_id: str = Path(..., description="LinkedIn experiment ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific LinkedIn experiment

    Args:
        experiment_id: LinkedIn experiment ID
    """
    try:
        # Get experiment from LinkedIn API
        experiment = await linkedin_service.get_experiment(experiment_id)
        return experiment
    except Exception as e:
        logger.error(f"Error getting LinkedIn experiment: {str(e)}")
        # Return empty dict if API fails
        return {}


@router.get("/experiments/{experiment_id}/results")
async def get_linkedin_experiment_results(
    experiment_id: str = Path(..., description="LinkedIn experiment ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Get results for a specific LinkedIn experiment

    Args:
        experiment_id: LinkedIn experiment ID
    """
    try:
        # Get experiment results from LinkedIn API
        results = await linkedin_service.get_experiment_results(experiment_id)
        return results
    except Exception as e:
        logger.error(f"Error getting LinkedIn experiment results: {str(e)}")
        # Return empty dict if API fails
        return {}


@router.post("/sync")
async def sync_linkedin_campaigns(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sync LinkedIn campaigns with the database
    """
    # Start sync in background
    background_tasks.add_task(linkedin_service.sync_campaigns, current_user.id, db)

    return {
        "status": "success",
        "message": "LinkedIn campaign sync started in background"
    }