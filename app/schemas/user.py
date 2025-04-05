from typing import List, Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str = "client_manager"

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None
    is_active: Optional[bool] = None

class ClientInfo(BaseModel):
    id: int
    name: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    clients: List[ClientInfo] = []

    class Config:
        from_attributes = True 