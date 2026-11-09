"""Data access for uploads."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Upload


class UploadRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, *, raw_text: str, core_insight: str, tone: str | None) -> Upload:
        upload = Upload(raw_text=raw_text, core_insight=core_insight, tone=tone)
        self._db.add(upload)
        self._db.commit()
        self._db.refresh(upload)
        return upload

    def get(self, upload_id: str) -> Upload | None:
        return self._db.get(Upload, upload_id)

    def list_recent(self, *, limit: int, offset: int) -> tuple[list[Upload], int]:
        total = self._db.scalar(select(func.count()).select_from(Upload)) or 0
        stmt = (
            select(Upload)
            .order_by(Upload.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self._db.scalars(stmt).all()), total
