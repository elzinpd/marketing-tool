"""
Database consistency fix script for Marketing Tool

This script resolves database schema inconsistencies by ensuring the correct
tables exist according to the models defined in app/db/models.py.
"""

import os
import sys
import logging
import sqlite3
from sqlalchemy import inspect, create_engine, text, Table, Column, Integer, ForeignKey, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import hashlib
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Database-Fix")

# Add the current directory to Python path
sys.path.insert(0, os.getcwd())

# Import the models and database modules
from app.core.config import settings
from app.db.models import Base, User, Client
from app.core.security import get_password_hash

# Connect to the database
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def check_admin_exists():
    """Check if admin user exists"""
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        return admin is not None
    except Exception as e:
        logger.error(f"Error checking admin user: {e}")
        return False

def create_admin_user():
    """Create admin user if it doesn't exist"""
    try:
        if not check_admin_exists():
            logger.info("Creating admin user: admin@example.com")
            
            # For testing purposes, we'll use a simpler hash or even store the plain password
            # This is NOT for production use, only for development/testing
            simple_hash = hashlib.sha256("admin123".encode()).hexdigest()
            
            admin = User(
                email="admin@example.com",
                hashed_password=simple_hash,  # Using simple hash to avoid bcrypt issues
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("✓ Created admin user successfully")
        else:
            logger.info("✓ Admin user already exists")
        return True
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        db.rollback()
        return False

def check_agency_head_exists():
    """Check if agency head user exists"""
    try:
        agency_head = db.query(User).filter(User.email == "agency@example.com").first()
        return agency_head is not None
    except Exception as e:
        logger.error(f"Error checking agency head user: {e}")
        return False

def create_agency_head_user():
    """Create agency head user if it doesn't exist"""
    try:
        if not check_agency_head_exists():
            logger.info("Creating agency head user: agency@example.com")
            
            # For testing purposes, we'll use a simpler hash or even store the plain password
            # This is NOT for production use, only for development/testing
            simple_hash = hashlib.sha256("agency123".encode()).hexdigest()
            
            agency_head = User(
                email="agency@example.com",
                hashed_password=simple_hash,  # Using simple hash to avoid bcrypt issues
                role="agency_head",
                is_active=True
            )
            db.add(agency_head)
            db.commit()
            logger.info("✓ Created agency head user successfully")
        else:
            logger.info("✓ Agency head user already exists")
        return True
    except Exception as e:
        logger.error(f"Error creating agency head user: {e}")
        db.rollback()
        return False

def check_demo_client_exists():
    """Check if demo client exists"""
    try:
        client = db.query(Client).filter(Client.name == "Demo Client").first()
        return client is not None
    except Exception as e:
        logger.error(f"Error checking demo client: {e}")
        return False

def create_demo_client():
    """Create a demo client if it doesn't exist"""
    try:
        if not check_demo_client_exists():
            logger.info("Creating demo client")
            demo_client = Client(
                name="Demo Client",
                campaign_keywords="marketing, demo, test"
            )
            db.add(demo_client)
            db.commit()
            logger.info("✓ Created demo client successfully")
        else:
            logger.info("✓ Demo client already exists")
        return True
    except Exception as e:
        logger.error(f"Error creating demo client: {e}")
        db.rollback()
        return False

def check_if_table_exists(table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    if table_name in inspector.get_table_names():
        return True
    else:
        return False

def check_if_column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text(f"PRAGMA table_info({table_name})"))
            columns = [row[1] for row in result]
            return column_name in columns
    except Exception as e:
        logger.error(f"Error checking if column exists: {e}")
        return False

def create_user_client_table():
    """Create the user_client association table if it doesn't exist"""
    try:
        if not check_if_table_exists("user_client"):
            logger.info("Creating user_client association table...")
            metadata = MetaData()
            Table(
                'user_client', 
                metadata,
                Column('user_id', Integer, ForeignKey('users.id')),
                Column('client_id', Integer, ForeignKey('clients.id'))
            )
            metadata.create_all(engine)
            logger.info("✓ Created user_client association table")
        else:
            logger.info("✓ user_client association table already exists")
    except Exception as e:
        logger.error(f"Error creating user_client table: {e}")

def add_name_column():
    """Add name column to users table if it doesn't exist"""
    try:
        if not check_if_column_exists("users", "name"):
            logger.info("Adding name column to users table...")
            with engine.connect() as connection:
                connection.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
                connection.commit()
            logger.info("✓ Added name column to users table")
        else:
            logger.info("✓ name column already exists in users table")
    except Exception as e:
        logger.error(f"Error adding name column: {e}")

def update_user_names():
    """Update user names based on email addresses"""
    try:
        from app.db.models import User
        
        users = db.query(User).all()
        updated_count = 0
        
        for user in users:
            if not user.name:
                # Set name from email (e.g., admin@example.com -> Admin)
                email_prefix = user.email.split('@')[0]
                name = email_prefix.capitalize()
                
                # Special case for admin
                if email_prefix == "admin":
                    name = "Admin User"
                elif email_prefix == "agency":
                    name = "Agency Head"
                elif email_prefix == "manager":
                    name = "Client Manager" 
                elif email_prefix == "test":
                    name = "Test User"
                
                user.name = name
                updated_count += 1
                logger.info(f"Setting name for {user.email} to '{name}'")
        
        if updated_count > 0:
            db.commit()
            logger.info(f"✓ Updated {updated_count} user names successfully")
        else:
            logger.info("✓ No user names needed updating")
    except Exception as e:
        logger.error(f"Error updating user names: {e}")
        db.rollback()

def main():
    logger.info("Starting database consistency check...")
    
    # Check if the database files exist
    db_path = settings.DATABASE_URL.replace("sqlite:///./", "")
    logger.info(f"Using database: {db_path}")
    
    if os.path.exists(db_path):
        logger.info(f"Database file exists: {db_path}")
        backup_path = f"{db_path}.backup"
        logger.info(f"Creating backup at: {backup_path}")
        with open(db_path, 'rb') as src, open(backup_path, 'wb') as dst:
            dst.write(src.read())
    else:
        logger.info(f"Database file doesn't exist - it will be created")
    
    # Create all tables according to the models
    logger.info("Creating tables from models...")
    Base.metadata.create_all(bind=engine)
    
    # Check which tables exist in the database
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    logger.info(f"Tables in database: {', '.join(tables)}")
    
    # Verify that the user_client_association table exists
    if 'user_client_association' not in tables:
        logger.warning("WARNING: user_client_association table doesn't exist!")
    else:
        logger.info("✓ user_client_association table exists")
    
    try:
        # Create users and clients
        create_admin_user()
        create_agency_head_user()
        create_demo_client()
            
        # Create user_client association table
        create_user_client_table()
            
        # Add name column
        add_name_column()
            
        # Update user names 
        update_user_names()
            
        logger.info("\nDatabase consistency check completed successfully")
        logger.info("You can now start the application with:")
        logger.info("$env:PYTHONPATH = '.'; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
            
    except Exception as e:
        logger.error(f"Error during database consistency check: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main() 