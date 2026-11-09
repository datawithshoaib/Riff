"""FastAPI dependencies shared by the v1 routers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.generation import GenerationService
from app.services.ingestion import IngestionService
from app.services.voice import VoiceService

DbSession = Annotated[Session, Depends(get_db)]


def get_ingestion_service(db: DbSession) -> IngestionService:
    return IngestionService(db)


def get_generation_service(db: DbSession) -> GenerationService:
    return GenerationService(db)


def get_voice_service(db: DbSession) -> VoiceService:
    return VoiceService(db)


IngestionServiceDep = Annotated[IngestionService, Depends(get_ingestion_service)]
GenerationServiceDep = Annotated[GenerationService, Depends(get_generation_service)]
VoiceServiceDep = Annotated[VoiceService, Depends(get_voice_service)]


@dataclass(frozen=True, slots=True)
class Pagination:
    limit: int
    offset: int


def get_pagination(
    limit: int = Query(default=24, ge=1, le=100, description="Page size"),
    offset: int = Query(default=0, ge=0, description="Records to skip"),
) -> Pagination:
    return Pagination(limit=limit, offset=offset)


PaginationDep = Annotated[Pagination, Depends(get_pagination)]
