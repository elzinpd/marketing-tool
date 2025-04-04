from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models.models import User
from app.core.auth import get_password_hash

def check_db():
    # Create a database session
    db = Session(bind=engine)

    try:
        # Check if superuser exists
        superuser = db.query(User).filter(User.email == "admin@techarena.com").first()
        if superuser:
            print("Superuser found:")
            print(f"Email: {superuser.email}")
            print(f"Full Name: {superuser.full_name}")
            print(f"Is Active: {superuser.is_active}")
            print(f"Is Superuser: {superuser.is_superuser}")
        else:
            print("Superuser not found. Creating one...")
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

    except Exception as e:
        print(f"Error checking database: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_db() 