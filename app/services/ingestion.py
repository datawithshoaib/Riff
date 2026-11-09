"""Use case: turn an uploaded screenshot into a persisted upload record."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.core.vision import extract_insight
from app.models.entities import Upload
from app.repositories.uploads import UploadRepository
from app.utils.images import preprocess_image

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class UploadResult:
    upload: Upload
    width: int
    height: int


class IngestionService:
    """Validates and preprocesses an image, extracts the insight, then stores it."""

    def __init__(self, db: Session) -> None:
        self._uploads = UploadRepository(db)

    async def ingest(
        self,
        *,
        filename: str | None,
        content_type: str | None,
        data: bytes,
    ) -> UploadResult:
        image = preprocess_image(data, content_type)
        logger.info(
            "Processing upload filename=%s size=%s dimensions=%sx%s",
            filename or "unknown",
            len(data),
            image.width,
            image.height,
        )

        vision = await extract_insight(image.data, image.media_type)
        upload = self._uploads.create(
            raw_text=vision["raw_text"],
            core_insight=vision["core_insight"],
            tone=vision["tone"],
        )
        return UploadResult(upload=upload, width=image.width, height=image.height)

    def get(self, upload_id: str) -> Upload:
        upload = self._uploads.get(upload_id)
        if upload is None:
            raise NotFoundError("That upload could not be found.")
        return upload

    def list(self, *, limit: int, offset: int) -> tuple[list[Upload], int]:
        return self._uploads.list_recent(limit=limit, offset=offset)
