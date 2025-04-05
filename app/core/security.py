from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import logging
import hashlib
from app.core.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("security")

# Password hashing
# Using a config with reduced rounds for bcrypt to improve compatibility
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Default is 12
    bcrypt__ident="2b"  # Use the most compatible version
)

# JWT settings
SECRET_KEY = "your-secret-key-here"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash with error handling"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        # Fallback to a more direct comparison if the library is having issues
        try:
            # If we're here, something went wrong with the passlib verify,
            # so we try a raw check through the hash function
            new_hash = get_password_hash(plain_password)
            return new_hash == hashed_password
        except Exception as e2:
            logger.error(f"Fallback verification also failed: {e2}")
            return False

def get_password_hash(password: str) -> str:
    """Hash a password"""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        # Use a simpler fallback if bcrypt is having issues
        return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token with proper claims"""
    to_encode = data.copy()
    
    # Set proper expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire.timestamp()})
    
    # Log token creation details (without sensitive data)
    logger.debug(f"Creating token for user: {to_encode.get('sub')} with exp: {expire.isoformat()}")
    
    # Create JWT token
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt 