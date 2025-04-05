from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.db.models import Base, User
from app.db.database import engine

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Create a session
    from app.db.database import SessionLocal
    db = SessionLocal()

    try:
        # Check if we already have a superuser
        user = db.query(User).filter(User.email == "admin@example.com").first()
        if not user:
            # Create superuser if it doesn't exist
            db_user = User(
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(db_user)
            db.commit()
            print("Created admin user: admin@example.com")
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating initial data")
    init_db()
    print("Initial data created") 