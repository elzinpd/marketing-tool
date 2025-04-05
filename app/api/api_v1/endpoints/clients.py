from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging

from app.db.database import get_db
from app.models.models import Client, User
from app.api.deps import get_current_user, get_current_active_admin

router = APIRouter()
logger = logging.getLogger(__name__)

class ClientBase(BaseModel):
    name: str
    campaign_keywords: List[str]

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: int

    class Config:
        from_attributes = True
        getters = True

@router.get("", response_model=List[ClientResponse])
async def get_all_clients(db: Session = Depends(get_db)):
    """Get all clients"""
    clients = db.query(Client).all()
    
    # Transform response to include campaign_keywords as a list
    result = []
    for client in clients:
        client_dict = {
            "id": client.id,
            "name": client.name,
            "campaign_keywords": client.campaign_keywords_list
        }
        result.append(client_dict)
    
    return result

@router.get("/assigned", response_model=List[ClientResponse])
async def get_assigned_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get clients assigned to the current user"""
    if current_user.role == "admin":
        clients = db.query(Client).all()
    else:
        clients = current_user.assigned_clients
    
    # Transform response to include campaign_keywords as a list
    result = []
    for client in clients:
        client_dict = {
            "id": client.id,
            "name": client.name,
            "campaign_keywords": client.campaign_keywords_list
        }
        result.append(client_dict)
    
    return result

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Create a new client (admin only)"""
    db_client = Client(
        name=client.name,
        campaign_keywords=",".join(client.campaign_keywords)
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check if user has access to this client
    if current_user.role != "admin" and db_client not in current_user.assigned_clients:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return db_client

@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Update a client (admin only)"""
    logger.info(f"Update request for client {client_id} with data: {client.dict()}")
    
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        logger.warning(f"Client with ID {client_id} not found")
        raise HTTPException(status_code=404, detail="Client not found")
    
    try:
        # Update basic fields
        db_client.name = client.name
        
        # Update campaign_keywords, ensuring we have a proper string
        if client.campaign_keywords:
            if isinstance(client.campaign_keywords, list):
                db_client.campaign_keywords = ",".join(client.campaign_keywords)
            else:
                logger.warning(f"Unexpected campaign_keywords type: {type(client.campaign_keywords)}")
                raise HTTPException(
                    status_code=400, 
                    detail="campaign_keywords must be a list of strings"
                )
        else:
            db_client.campaign_keywords = ""
        
        # Save changes
        db.commit()
        db.refresh(db_client)
        
        # Log the result
        logger.info(f"Client {client_id} updated successfully: {db_client.name}")
        
        # Return formatted response
        return {
            "id": db_client.id,
            "name": db_client.name,
            "campaign_keywords": db_client.campaign_keywords_list
        }
    except Exception as e:
        logger.error(f"Error updating client {client_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating client: {str(e)}"
        )

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Delete a client (admin only)"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(db_client)
    db.commit()
    return None 