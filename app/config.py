"""Application settings.

All runtime configuration lives here, sourced from environment variables and an
optional ``.env`` file. Import ``settings`` for the shared instance or call
``get_settings`` when you need a fresh copy (useful in tests).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Application -----------------------------------------------------
    APP_NAME: str = "Riff API"
    VERSION: str = "0.2.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001"
    )

    # --- Database --------------------------------------------------------
    DATABASE_URL: str = "sqlite:///./riff.db"
    AUTO_CREATE_TABLES: bool = True

    # --- Providers -------------------------------------------------------
    # "auto" uses Groq when an API key is present and falls back to the
    # deterministic demo provider otherwise. Explicit values: groq | stub.
    VISION_PROVIDER: str = "auto"
    GENERATION_PROVIDER: str = "auto"
    GROQ_API_KEY: str = ""
    GROQ_VISION_MODEL: str = "qwen/qwen3.6-vl-27b"
    GROQ_GENERATION_MODEL: str = "llama-3.3-70b-versatile"

    # --- Pipeline --------------------------------------------------------
    MAX_UPLOAD_BYTES: int = Field(default=10 * 1024 * 1024, ge=1)
    VISION_MAX_DIMENSION: int = Field(default=1568, ge=256, le=4096)
    VISION_JPEG_QUALITY: int = Field(default=85, ge=50, le=100)
    DRAFT_COUNT: int = Field(default=3, ge=1, le=6)
    VOICE_SAMPLE_LIMIT: int = Field(default=3, ge=1, le=10)
    SIMILARITY_THRESHOLD: float = Field(default=0.85, gt=0, le=1)
    NGRAM_OVERLAP_THRESHOLD: float = Field(default=0.40, gt=0, le=1)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def is_demo_mode(self) -> bool:
        """True when requests will be served by the offline demo provider."""
        return not self.GROQ_API_KEY.strip()

    @property
    def provider_mode(self) -> str:
        return "demo" if self.is_demo_mode else "live"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
