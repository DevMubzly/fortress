from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_PATH: str = "./data/fortress.db"
    SESSION_SECRET: str = "change_me_to_a_random_string"  # Use env vars for production
    SESSION_EXPIRY: int = 86400  # 24 hours in seconds
    SESSION_EXPIRY_REMEMBER: int = 2592000  # 30 days in seconds
    BCRYPT_ROUNDS: int = 12
    ENCRYPTION_KEY: str = "change_me_to_a_32_byte_string_for_fernet"

    class Config:
        env_file = ".env"

settings = Settings()
