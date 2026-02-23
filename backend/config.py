import os
from pydantic_settings import BaseSettings

# Ensure database is stored in backend/data regardless of execution context
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "data", "fortress.db")

class Settings(BaseSettings):
    DATABASE_PATH: str = DEFAULT_DB_PATH
    SESSION_SECRET: str = "change_me_to_a_random_string"  # Use env vars for production
    SESSION_EXPIRY: int = 86400  # 24 hours in seconds
    SESSION_EXPIRY_REMEMBER: int = 2592000  # 30 days in seconds
    BCRYPT_ROUNDS: int = 12
    ENCRYPTION_KEY: str = "5aaI1tQaVaWvcs6rCe1yd0pFI2VFx3RYvznK2YNs1w8="

    class Config:
        env_file = ".env"

settings = Settings()
