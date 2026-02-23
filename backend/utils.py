import bcrypt
from datetime import datetime, timedelta
import secrets
from backend.config import settings

cipher_suite = Fernet(settings.ENCRYPTION_KEY)  # Handle key generation elsewhere if needed

def get_password_hash(password: str) -> str:
    # Ensure password is encoded to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

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
