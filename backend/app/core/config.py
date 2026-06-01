# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory System API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration - defaults to SQLite for immediate usability
    DATABASE_URL: str = "sqlite:///./inventory.db"
    SECRET_KEY: str = "secret-key-change-in-production"
    
    # Load configuration from environment file if available
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
