# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    # This tells Pydantic to read from a .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App Metadata
    app_name: str = "CivicAI Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"

    # Security: Essential for JWT isolation
    jwt_secret: str                        
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080        # 7 days

    # Anthropic Claude Configuration
    anthropic_api_key: str
    groq_api_key: str
    alibaba_api_key: str
    google_api_key: str
    
    # Preferred order of providers
    ai_provider_priority: list[str] = ["groq", "alibaba", "anthropic", "google"]

    # Infrastructure URLs
    mongodb_url: str                       
    mongodb_db_name: str = "civicai"
    redis_url: str                         
    redis_cache_ttl: int = 86400           # 24h cache for World Bank data

    # Worker Settings (ARQ)
    arq_max_jobs: int = 5
    arq_job_timeout: int = 300

    # CORS settings for Next.js frontend
    allowed_origins: List[str] = ["http://localhost:3000"]

@lru_cache
def get_settings() -> Settings:
    """Returns a cached instance of settings to avoid re-reading disk."""
    return Settings()