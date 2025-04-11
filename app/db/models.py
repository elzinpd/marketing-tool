from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Association table for user-client relationships
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
    name = Column(String, index=True, nullable=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="client_manager")  # "admin", "agency_head", or "client_manager"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clients = relationship("Client", secondary=user_client, back_populates="users")
    reports = relationship("Report", back_populates="user")

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    campaign_keywords = Column(String)  # Comma-separated keywords
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", secondary=user_client, back_populates="clients")
    reports = relationship("Report", back_populates="client")
    campaigns = relationship("Campaign", back_populates="client")

    @property
    def campaign_keywords_list(self):
        """Convert comma-separated keywords to a list"""
        if not self.campaign_keywords:
            return []
        return [keyword.strip() for keyword in self.campaign_keywords.split(',') if keyword.strip()]

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    platform = Column(String)  # "linkedin", "facebook", etc.
    client_id = Column(Integer, ForeignKey("clients.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    client = relationship("Client", back_populates="campaigns")
    metrics = relationship("CampaignMetric", back_populates="campaign")

class CampaignMetric(Base):
    __tablename__ = "campaign_metrics"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    date = Column(DateTime(timezone=True))
    impressions = Column(Integer)
    clicks = Column(Integer)
    spend = Column(Integer)
    conversions = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    campaign = relationship("Campaign", back_populates="metrics")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))

    # Relationships
    user = relationship("User", back_populates="reports")
    client = relationship("Client", back_populates="reports")