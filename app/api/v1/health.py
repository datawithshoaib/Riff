"""Health and service metadata."""

from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.core.providers import provider_status
from app.models.schemas import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse, summary="Service health")
def health() -> HealthResponse:
    status = provider_status()
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        mode=status["mode"],
        vision_provider=status["vision_provider"],
        generation_provider=status["generation_provider"],
        database="sqlite" if settings.is_sqlite else "postgresql",
        similarity_threshold=settings.SIMILARITY_THRESHOLD,
    )
