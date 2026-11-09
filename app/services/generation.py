"""Use case: generate original drafts for an existing upload."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import NotFoundError
from app.core.generation import generate_and_check
from app.core.voice_matching import select_voice_examples
from app.models.entities import Generation
from app.repositories.generations import GenerationRepository
from app.repositories.uploads import UploadRepository
from app.repositories.voice_profiles import VoiceProfileRepository

logger = logging.getLogger(__name__)


class GenerationService:
    def __init__(self, db: Session) -> None:
        self._uploads = UploadRepository(db)
        self._generations = GenerationRepository(db)
        self._voices = VoiceProfileRepository(db)

    async def generate(
        self,
        *,
        upload_id: str,
        voice_profile_id: str | None = None,
        draft_count: int | None = None,
    ) -> Generation:
        upload = self._uploads.get(upload_id)
        if upload is None:
            raise NotFoundError("That upload could not be found. Re-upload the screenshot.")

        voice_examples: list[str] = []
        if voice_profile_id:
            profile = self._voices.get(voice_profile_id)
            if profile is None:
                raise NotFoundError("That voice profile could not be found.")
            voice_examples = select_voice_examples(
                profile.past_posts,
                upload.core_insight,
                settings.VOICE_SAMPLE_LIMIT,
            )

        result = await generate_and_check(
            insight=upload.core_insight,
            voice_examples=voice_examples,
            raw_text=upload.raw_text,
            count=draft_count or settings.DRAFT_COUNT,
        )

        drafts = result["drafts"]
        flagged = result["flagged"]
        logger.info(
            "Generated %s drafts (%s flagged) for upload=%s",
            len(drafts),
            sum(1 for flag in flagged if flag),
            upload_id,
        )

        return self._generations.create(
            upload_id=upload.id,
            voice_profile_id=voice_profile_id,
            drafts=drafts,  # type: ignore[arg-type]
            flagged=flagged,  # type: ignore[arg-type]
        )

    def get(self, generation_id: str) -> Generation:
        generation = self._generations.get(generation_id)
        if generation is None:
            raise NotFoundError("That generation could not be found.")
        return generation

    def list(self, *, limit: int, offset: int) -> tuple[list[Generation], int]:
        return self._generations.list_recent(limit=limit, offset=offset)
