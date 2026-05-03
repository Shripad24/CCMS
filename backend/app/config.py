from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:yourpassword@localhost:5432/ccms_db"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-minimum-32-chars-long-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI
    GEMINI_API_KEY: str = ""

    # Email
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@ccms.edu.in"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    # Institution
    INSTITUTION_EMAIL_DOMAIN: str = "edu.in"

    # Development
    DEV_MODE: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
