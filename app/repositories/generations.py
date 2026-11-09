"""Data access for generations."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.entities import Generation


class GenerationRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self,
        *,
        upload_id: str,
        voice_profile_id: str | None,
        drafts: list[dict[str, Any]],
        flagged: list[bool],
    ) -> Generation:
        generation = Generation(
            upload_id=upload_id,
            voice_profile_id=voice_profile_id,
            drafts=drafts,
            flagged=flagged,
        )
        self._db.add(generation)
        self._db.commit()
        self._db.refresh(generation)
        return generation

    def get(self, generation_id: str) -> Generation | None:
        stmt = (
            select(Generation)
            .options(joinedload(Generation.upload))
            .where(Generation.id == generation_id)
        )
        return self._db.scalars(stmt).first()

    def list_recent(self, *, limit: int, offset: int) -> tuple[list[Generation], int]:
        total = self._db.scalar(select(func.count()).select_from(Generation)) or 0
        stmt = (
            select(Generation)
            .options(joinedload(Generation.upload))
            .order_by(Generation.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self._db.scalars(stmt).all()), total
