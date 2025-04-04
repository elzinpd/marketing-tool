from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models.models import User
from app.core.auth import get_password_hash
from app.core.config import settings

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create a database session
    db = Session(bind=engine)

    try:
        # Check if superuser exists
        superuser = db.query(User).filter(User.email == "admin@techarena.com").first()
        if not superuser:
            # Create superuser
            superuser = User(
                email="admin@techarena.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                is_active=True,
                is_superuser=True
            )
            db.add(superuser)
            db.commit()
            print("Superuser created successfully")
        else:
            print("Superuser already exists")

    except Exception as e:
        print(f"Error creating superuser: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 