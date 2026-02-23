import bcrypt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from datetime import datetime, timedelta
import secrets
from backend.config import settings

# Fix for passlib 1.7.4 compatibility with bcrypt >= 4.0.0
# passlib attempts to access bcrypt.__about__ which was removed in bcrypt 4.0.0
if not hasattr(bcrypt, '__about__'):
    try:
        class BcryptAbout:
            pass
        bcrypt.__about__ = BcryptAbout()
        bcrypt.__about__.__version__ = bcrypt.__version__
    except Exception:
        pass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
cipher_suite = Fernet(settings.ENCRYPTION_KEY)  # Handle key generation elsewhere if needed

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def encrypt_value(value: str) -> str:
    return cipher_suite.encrypt(value.encode()).decode()

def decrypt_value(value: str) -> str:
    return cipher_suite.decrypt(value.encode()).decode()

def generate_session_token():
    return secrets.token_hex(32)

def generate_session_expiry(days=1):
    return datetime.utcnow() + timedelta(days=days)

def validate_password_strength(password):
    if len(password) < 12:
        return False, ["Password must be at least 12 characters long"]
    if not any(c.isupper() for c in password):
        return False, ["Password must contain at least one uppercase letter"]
    if not any(c.islower() for c in password):
        return False, ["Password must contain at least one lowercase letter"]
    if not any(c.isdigit() for c in password):
        return False, ["Password must contain at least one number"]
    if not any(not c.isalnum() for c in password):
        return False, ["Password must contain at least one special character"]
    return True, []
