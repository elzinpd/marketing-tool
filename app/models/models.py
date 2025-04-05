from sqlalchemy import Boolean, Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

# Association table for user-client relationship
user_client = Table(
    'user_client',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('client_id', Integer, ForeignKey('clients.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    
    # Many-to-many relationship with clients
    assigned_clients = relationship("Client", secondary=user_client, back_populates="assigned_users")

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    campaign_keywords = Column(String)  # Stored as comma-separated string
    
    # Many-to-many relationship with users
    assigned_users = relationship("User", secondary=user_client, back_populates="assigned_clients")
    
    # Get campaign keywords as a list
    @property
    def campaign_keywords_list(self):
        if not self.campaign_keywords:
            return []
        return [keyword.strip() for keyword in self.campaign_keywords.split(',') if keyword.strip()] 