import logging
import os
from app.core.security import get_password_hash
from app.db.models import Base, User
from app.db.database import engine

# Configure logging
logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database with tables and default admin user"""
    # Create tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")



    # Create a session
    from app.db.database import SessionLocal
    db = SessionLocal()

    try:
        # Check if we already have a superuser
        user = db.query(User).filter(User.email == "admin@example.com").first()
        if not user:
            # Create superuser if it doesn't exist
            # Get admin password from environment or use a default for development
            admin_password = os.getenv("ADMIN_PASSWORD", "Marketing@Admin2025")
            # Log a warning if using the default password
            if admin_password == "Marketing@Admin2025":
                logger.warning(
                    "Using default admin password. This is insecure! "
                    "Set ADMIN_PASSWORD environment variable in production."
                )

            db_user = User(
                email="admin@example.com",
                hashed_password=get_password_hash(admin_password),
                name="System Administrator",
                role="admin",
                is_active=True
            )
            db.add(db_user)
            db.commit()
            logger.info("Created admin user: admin@example.com")
            print(f"""
            ------------------------------------------------------------------------
            Admin user created successfully!
            Email: admin@example.com
            Password: {admin_password}

            IMPORTANT: Please change this password after your first login.
            ------------------------------------------------------------------------
            """)
        else:
            logger.info("Admin user already exists - skipping creation")
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization completed")