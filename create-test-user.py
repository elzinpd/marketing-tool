"""
Script to create a test user directly in the database.
This bypasses the bcrypt hashing and uses a simple hash for testing.
"""
import os
import sys
import hashlib
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.models import User
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("Database-Fix")

# Database setup
DATABASE_URL = "sqlite:///marketing_tool.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

def create_user(email, password, role="client_manager", name=None):
    """Create a user with a simple hash password"""
    try:
        # Check if user already exists
        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user:
            logger.info(f"User {email} already exists. Updating password...")
            # Update password and name
            simple_hash = hashlib.sha256(password.encode()).hexdigest()
            existing_user.hashed_password = simple_hash
            if name:
                existing_user.name = name
            session.commit()
            logger.info(f"Password updated for user {email}")
            return existing_user
        
        # Create new user with simple hash
        logger.info(f"Creating user {email}...")
        simple_hash = hashlib.sha256(password.encode()).hexdigest()
        
        user = User(
            email=email,
            name=name or email.split('@')[0].capitalize(),  # Default name from email
            hashed_password=simple_hash,
            role=role,
            is_active=True
        )
        session.add(user)
        session.commit()
        logger.info(f"User {email} created successfully with role {role}")
        return user
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        session.rollback()
        return None

def main():
    """Create test users with different roles"""
    try:
        logger.info("Connected to database: %s", DATABASE_URL)
        logger.info("Creating test users...")
        
        # Create admin user
        admin = create_user(
            email="admin@example.com",
            password="admin123",
            role="admin",
            name="Admin User"
        )
        
        # Create agency head user
        agency_head = create_user(
            email="agency@example.com",
            password="agency123",
            role="agency_head",
            name="Agency Head"
        )
        
        # Create client manager user
        manager = create_user(
            email="manager@example.com",
            password="manager123",
            role="client_manager",
            name="Client Manager"
        )
        
        # Create test user
        test_user = create_user(
            email="test@example.com",
            password="test123",
            role="client_manager",
            name="Test User"
        )
        
        logger.info("Test users creation complete!")
        logger.info("\nTest credentials:")
        logger.info("------------------")
        logger.info("Admin: admin@example.com / admin123")
        logger.info("Agency Head: agency@example.com / agency123")
        logger.info("Client Manager: manager@example.com / manager123")
        logger.info("Test User: test@example.com / test123")
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
    sys.exit(0) 