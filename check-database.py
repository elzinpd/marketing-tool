import logging
import sys
import hashlib
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("DB-Check")

# Database connection settings
DATABASE_URL = "sqlite:///marketing_tool.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Import models after database setup
from app.db.models import User, Client, user_client

def simple_hash(password):
    """Create a simple SHA-256 hash for testing"""
    return hashlib.sha256(password.encode()).hexdigest()

def check_users():
    """Check and display all users in the database"""
    users = db.query(User).all()
    logger.info(f"Found {len(users)} users in the database:")
    
    for user in users:
        clients = [c.name for c in user.clients] if hasattr(user, 'clients') and user.clients else []
        logger.info(f"- ID: {user.id}, Name: {user.name or 'None'}, Email: {user.email}, Role: {user.role}, Active: {user.is_active}, Clients: {clients}")
    
    return users

def check_clients():
    """Check and display all clients in the database"""
    clients = db.query(Client).all()
    logger.info(f"Found {len(clients)} clients in the database:")
    
    for client in clients:
        users = [u.email for u in client.users] if hasattr(client, 'users') and client.users else []
        logger.info(f"- ID: {client.id}, Name: {client.name}, Keywords: {client.campaign_keywords}, Users: {users}")
    
    return clients

def create_sample_data():
    """Create sample users and clients if the database is empty"""
    # Check if we need to create sample data
    users = db.query(User).all()
    clients = db.query(Client).all()
    
    if len(users) >= 8 and len(clients) >= 6:
        logger.info("Database already has sample data")
        run_consistency_check()
        return
    
    logger.info("Creating sample data...")
    
    # Create users if needed
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@example.com",
            name="Admin User",
            hashed_password=simple_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        logger.info("Created admin user: admin@example.com / admin123")
    
    agency_user = db.query(User).filter(User.email == "agency@example.com").first()
    if not agency_user:
        agency_user = User(
            email="agency@example.com",
            name="Agency Head",
            hashed_password=simple_hash("agency123"),
            role="agency_head",
            is_active=True
        )
        db.add(agency_user)
        logger.info("Created agency head user: agency@example.com / agency123")
    
    manager_user = db.query(User).filter(User.email == "manager@example.com").first()
    if not manager_user:
        manager_user = User(
            email="manager@example.com",
            name="Client Manager",
            hashed_password=simple_hash("manager123"),
            role="client_manager",
            is_active=True
        )
        db.add(manager_user)
        logger.info("Created manager user: manager@example.com / manager123")
    
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=simple_hash("test123"),
            role="client_manager",
            is_active=True
        )
        db.add(test_user)
        logger.info("Created test user: test@example.com / test123")
    
    # Additional client managers
    senior_manager = db.query(User).filter(User.email == "senior@example.com").first()
    if not senior_manager:
        senior_manager = User(
            email="senior@example.com",
            name="Senior Manager",
            hashed_password=simple_hash("senior123"),
            role="client_manager",
            is_active=True
        )
        db.add(senior_manager)
        logger.info("Created senior manager: senior@example.com / senior123")
    
    junior_manager = db.query(User).filter(User.email == "junior@example.com").first()
    if not junior_manager:
        junior_manager = User(
            email="junior@example.com",
            name="Junior Manager",
            hashed_password=simple_hash("junior123"),
            role="client_manager",
            is_active=True
        )
        db.add(junior_manager)
        logger.info("Created junior manager: junior@example.com / junior123")
        
    regional_manager = db.query(User).filter(User.email == "regional@example.com").first()
    if not regional_manager:
        regional_manager = User(
            email="regional@example.com",
            name="Regional Manager",
            hashed_password=simple_hash("regional123"),
            role="client_manager",
            is_active=True
        )
        db.add(regional_manager)
        logger.info("Created regional manager: regional@example.com / regional123")
        
    account_exec = db.query(User).filter(User.email == "account@example.com").first()
    if not account_exec:
        account_exec = User(
            email="account@example.com",
            name="Account Executive",
            hashed_password=simple_hash("account123"),
            role="client_manager",
            is_active=True
        )
        db.add(account_exec)
        logger.info("Created account executive: account@example.com / account123")
    
    # Commit user changes
    db.commit()
    
    # Create clients if needed
    acme_client = db.query(Client).filter(Client.name == "Acme Corp").first()
    if not acme_client:
        acme_client = Client(
            name="Acme Corp",
            campaign_keywords="acme, anvil, roadrunner, coyote"
        )
        db.add(acme_client)
        logger.info("Created Acme Corp client")
    
    tech_client = db.query(Client).filter(Client.name == "TechStart").first()
    if not tech_client:
        tech_client = Client(
            name="TechStart",
            campaign_keywords="startup, innovation, tech, AI"
        )
        db.add(tech_client)
        logger.info("Created TechStart client")
    
    global_client = db.query(Client).filter(Client.name == "Global Industries").first()
    if not global_client:
        global_client = Client(
            name="Global Industries",
            campaign_keywords="global, international, worldwide, multinational"
        )
        db.add(global_client)
        logger.info("Created Global Industries client")
    
    # Additional clients
    abc_client = db.query(Client).filter(Client.name == "ABC Company").first()
    if not abc_client:
        abc_client = Client(
            name="ABC Company",
            campaign_keywords="ABC, alphabet, corporate, professional"
        )
        db.add(abc_client)
        logger.info("Created ABC Company client")
    
    xyz_client = db.query(Client).filter(Client.name == "XYZ Solutions").first()
    if not xyz_client:
        xyz_client = Client(
            name="XYZ Solutions",
            campaign_keywords="XYZ, solution, service, business"
        )
        db.add(xyz_client)
        logger.info("Created XYZ Solutions client")
        
    healthcare_client = db.query(Client).filter(Client.name == "Healthcare Plus").first()
    if not healthcare_client:
        healthcare_client = Client(
            name="Healthcare Plus",
            campaign_keywords="healthcare, medical, wellness, hospital, clinic"
        )
        db.add(healthcare_client)
        logger.info("Created Healthcare Plus client")
        
    finance_client = db.query(Client).filter(Client.name == "Finance Partners").first()
    if not finance_client:
        finance_client = Client(
            name="Finance Partners",
            campaign_keywords="finance, banking, investment, money, wealth"
        )
        db.add(finance_client)
        logger.info("Created Finance Partners client")
    
    # Commit client changes
    db.commit()
    
    # Assign clients to users if needed
    try:
        # Get all clients and users again after commit
        all_clients = db.query(Client).all()
        
        # Manager gets Acme and TechStart
        if manager_user:
            manager_clients = set(manager_user.clients) if manager_user.clients else set()
            if acme_client and acme_client not in manager_clients:
                manager_clients.add(acme_client)
            if tech_client and tech_client not in manager_clients:
                manager_clients.add(tech_client)
            if manager_clients:
                manager_user.clients = list(manager_clients)
                logger.info(f"Assigned clients to {manager_user.email}: {[c.name for c in manager_clients]}")
        
        # Test user gets Global Industries
        if test_user:
            test_clients = set(test_user.clients) if test_user.clients else set()
            if global_client and global_client not in test_clients:
                test_clients.add(global_client)
            if test_clients:
                test_user.clients = list(test_clients)
                logger.info(f"Assigned clients to {test_user.email}: {[c.name for c in test_clients]}")
        
        # Senior manager gets ABC and Global
        if senior_manager:
            senior_clients = set(senior_manager.clients) if senior_manager.clients else set()
            if abc_client and abc_client not in senior_clients:
                senior_clients.add(abc_client)
            if global_client and global_client not in senior_clients:
                senior_clients.add(global_client)
            if senior_clients:
                senior_manager.clients = list(senior_clients)
                logger.info(f"Assigned clients to {senior_manager.email}: {[c.name for c in senior_clients]}")
        
        # Junior manager gets XYZ and TechStart
        if junior_manager:
            junior_clients = set(junior_manager.clients) if junior_manager.clients else set()
            if xyz_client and xyz_client not in junior_clients:
                junior_clients.add(xyz_client)
            if tech_client and tech_client not in junior_clients:
                junior_clients.add(tech_client)
            if junior_clients:
                junior_manager.clients = list(junior_clients)
                logger.info(f"Assigned clients to {junior_manager.email}: {[c.name for c in junior_clients]}")
                
        # Regional manager gets Healthcare Plus
        if regional_manager:
            regional_clients = set(regional_manager.clients) if regional_manager.clients else set()
            if healthcare_client and healthcare_client not in regional_clients:
                regional_clients.add(healthcare_client)
            if regional_clients:
                regional_manager.clients = list(regional_clients)
                logger.info(f"Assigned clients to {regional_manager.email}: {[c.name for c in regional_clients]}")
                
        # Account executive gets Finance Partners and ABC Company
        if account_exec:
            account_clients = set(account_exec.clients) if account_exec.clients else set()
            if finance_client and finance_client not in account_clients:
                account_clients.add(finance_client)
            if abc_client and abc_client not in account_clients:
                account_clients.add(abc_client)
            if account_clients:
                account_exec.clients = list(account_clients)
                logger.info(f"Assigned clients to {account_exec.email}: {[c.name for c in account_clients]}")
        
        # Ensure admin has access to all clients
        if admin_user:
            admin_user.clients = all_clients
            logger.info(f"Assigned all clients to admin user")
            
        # Commit relationship changes
        db.commit()
    except Exception as e:
        logger.error(f"Error assigning clients to users: {e}")
        db.rollback()

def run_consistency_check():
    """Check for data consistency and fix any issues"""
    try:
        # Check if any users have no name
        users_without_name = db.query(User).filter(User.name == None).all()
        if users_without_name:
            logger.info(f"Found {len(users_without_name)} users without names, updating...")
            
            for user in users_without_name:
                email_prefix = user.email.split('@')[0]
                name = email_prefix.capitalize()
                
                # Special case for known users
                if email_prefix == "admin":
                    name = "Admin User"
                elif email_prefix == "agency":
                    name = "Agency Head"
                elif email_prefix == "manager":
                    name = "Client Manager"
                elif email_prefix == "test":
                    name = "Test User"
                elif email_prefix == "senior":
                    name = "Senior Manager"
                elif email_prefix == "junior":
                    name = "Junior Manager"
                elif email_prefix == "regional":
                    name = "Regional Manager"
                elif email_prefix == "account":
                    name = "Account Executive"
                
                user.name = name
                logger.info(f"Setting name for {user.email} to '{name}'")
            
            db.commit()
            logger.info("✓ Updated user names successfully")
        
        # Check if admin has all clients
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        all_clients = db.query(Client).all()
        
        if admin_user and len(all_clients) > 0:
            admin_clients = set(admin_user.clients) if hasattr(admin_user, 'clients') and admin_user.clients else set()
            missing_clients = [c for c in all_clients if c not in admin_clients]
            
            if missing_clients:
                logger.info(f"Admin user is missing {len(missing_clients)} clients, updating...")
                admin_user.clients = all_clients
                db.commit()
                logger.info("✓ Updated admin user's client access")
                
    except Exception as e:
        logger.error(f"Error during consistency check: {e}")
        db.rollback()

def main():
    """Main function to check and populate the database"""
    logger.info(f"Checking database: {DATABASE_URL}")
    
    try:
        # Check if database has tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if not tables or "users" not in tables or "clients" not in tables:
            logger.warning("Database is missing essential tables!")
            return
        
        # Create sample data if needed
        create_sample_data()
        
        # Check and display database contents
        users = check_users()
        clients = check_clients()
        
        logger.info("\nDatabase check complete.")
        logger.info(f"Users: {len(users)}, Clients: {len(clients)}")
        
    except Exception as e:
        logger.error(f"Error during database check: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 