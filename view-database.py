import logging
import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("DB-View")

# Database connection settings
DATABASE_URL = "sqlite:///marketing_tool.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Import models after database setup
from app.db.models import User, Client

def display_users():
    """Display all users in a table format"""
    users = db.query(User).all()
    
    if not users:
        logger.warning("No users found in database!")
        return
    
    print("\n=== USERS ===")
    print("-" * 100)
    print(f"{'ID':<3} | {'Name':<20} | {'Email':<25} | {'Role':<15} | {'Active':<6} | {'Clients'}")
    print("-" * 100)
    
    for user in users:
        clients = [c.name for c in user.clients] if hasattr(user, 'clients') and user.clients else []
        clients_str = ", ".join(clients) if clients else "None"
        
        is_active = "Yes" if user.is_active else "No"
        name = user.name or "None"
        
        print(f"{user.id:<3} | {name[:20]:<20} | {user.email[:25]:<25} | {user.role[:15]:<15} | {is_active:<6} | {clients_str}")
    
    print("-" * 100)
    print(f"Total Users: {len(users)}")

def display_clients():
    """Display all clients in a table format"""
    clients = db.query(Client).all()
    
    if not clients:
        logger.warning("No clients found in database!")
        return
    
    print("\n=== CLIENTS ===")
    print("-" * 100)
    print(f"{'ID':<3} | {'Name':<20} | {'Keywords':<30} | {'Managers'}")
    print("-" * 100)
    
    for client in clients:
        users = [u.name or u.email for u in client.users] if hasattr(client, 'users') and client.users else []
        users_str = ", ".join(users) if users else "None"
        
        keywords = client.campaign_keywords[:30] if client.campaign_keywords else "None"
        
        print(f"{client.id:<3} | {client.name[:20]:<20} | {keywords:<30} | {users_str}")
    
    print("-" * 100)
    print(f"Total Clients: {len(clients)}")

def main():
    """Display all database content"""
    logger.info(f"Connecting to database: {DATABASE_URL}")
    
    try:
        # Check if database has tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if not tables or "users" not in tables or "clients" not in tables:
            logger.warning("Database is missing essential tables!")
            return
        
        logger.info(f"Tables in database: {', '.join(tables)}")
        
        # Display all content
        display_users()
        display_clients()
        
    except Exception as e:
        logger.error(f"Error displaying database content: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main() 