import logging
import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("DB-Export")

# Database connection settings
DATABASE_URL = "sqlite:///marketing_tool.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Import models after database setup
from app.db.models import User, Client

def export_database():
    """Export database contents to a text file"""
    output_file = "database_export.txt"
    
    with open(output_file, "w") as f:
        # Export Users
        users = db.query(User).all()
        f.write("=== USERS ===\n")
        f.write("Total Users: {}\n\n".format(len(users)))
        
        for user in users:
            clients = [c.name for c in user.clients] if hasattr(user, 'clients') and user.clients else []
            clients_str = ", ".join(clients) if clients else "None"
            
            f.write("ID: {}\n".format(user.id))
            f.write("Name: {}\n".format(user.name or "None"))
            f.write("Email: {}\n".format(user.email))
            f.write("Role: {}\n".format(user.role))
            f.write("Active: {}\n".format("Yes" if user.is_active else "No"))
            f.write("Clients: {}\n".format(clients_str))
            f.write("------------------------\n")
        
        # Export Clients
        clients = db.query(Client).all()
        f.write("\n=== CLIENTS ===\n")
        f.write("Total Clients: {}\n\n".format(len(clients)))
        
        for client in clients:
            users = [u.name or u.email for u in client.users] if hasattr(client, 'users') and client.users else []
            users_str = ", ".join(users) if users else "None"
            
            f.write("ID: {}\n".format(client.id))
            f.write("Name: {}\n".format(client.name))
            f.write("Keywords: {}\n".format(client.campaign_keywords or "None"))
            f.write("Managers: {}\n".format(users_str))
            f.write("------------------------\n")
    
    logger.info(f"Database exported to {output_file}")
    return output_file

def main():
    """Export database contents to a file"""
    logger.info(f"Connecting to database: {DATABASE_URL}")
    
    try:
        # Check if database has tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if not tables or "users" not in tables or "clients" not in tables:
            logger.warning("Database is missing essential tables!")
            return
        
        logger.info(f"Tables in database: {', '.join(tables)}")
        
        # Export database
        output_file = export_database()
        logger.info(f"Database export complete. Check {output_file} for details.")
        
    except Exception as e:
        logger.error(f"Error exporting database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main() 