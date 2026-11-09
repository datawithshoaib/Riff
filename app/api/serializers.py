"""Mapping between ORM entities and response schemas.

Kept out of the route modules so response shaping is consistent everywhere and
older records (where drafts were plain strings) still render correctly.
"""

from __future__ import annotations

from typing import Any

from app.models.entities import Generation, Upload, VoiceProfile
from app.models.schemas import (
    DraftResponse,
    GenerateResponse,
    GenerationSummary,
    UploadResponse,
    VoiceProfileResponse,
)


def upload_to_response(upload: Upload) -> UploadResponse:
    return UploadResponse(
        upload_id=upload.id,
        raw_text=upload.raw_text,
        core_insight=upload.core_insight,
        tone=upload.tone,
        created_at=upload.created_at,
    )


def _draft_to_response(raw: Any) -> DraftResponse:
    if isinstance(raw, str):
        return DraftResponse(text=raw, word_count=len(raw.split()))
    if isinstance(raw, dict):
        text = str(raw.get("text", ""))
        return DraftResponse(
            text=text,
            flagged=bool(raw.get("flagged", False)),
            similarity=round(float(raw.get("similarity", 0.0)), 4),
            phrase_overlap=round(float(raw.get("phrase_overlap", 0.0)), 4),
            word_count=int(raw.get("word_count") or len(text.split())),
        )
    return DraftResponse(text=str(raw))


def generation_to_response(generation: Generation) -> GenerateResponse:
    upload = generation.upload
    return GenerateResponse(
        generation_id=generation.id,
        upload_id=generation.upload_id,
        core_insight=upload.core_insight if upload else "",
        tone=upload.tone if upload else None,
        drafts=[_draft_to_response(raw) for raw in (generation.drafts or [])],
        created_at=generation.created_at,
    )


def generation_to_summary(generation: Generation) -> GenerationSummary:
    drafts = [_draft_to_response(raw) for raw in (generation.drafts or [])]
    preview = drafts[0].text if drafts else ""
    if len(preview) > 180:
        preview = preview[:177].rstrip() + "..."
    return GenerationSummary(
        generation_id=generation.id,
        upload_id=generation.upload_id,
        core_insight=generation.upload.core_insight if generation.upload else "",
        tone=generation.upload.tone if generation.upload else None,
        draft_count=len(drafts),
        flagged_count=sum(1 for draft in drafts if draft.flagged),
        preview=preview,
        created_at=generation.created_at,
    )


def voice_profile_to_response(profile: VoiceProfile) -> VoiceProfileResponse:
    return VoiceProfileResponse(
        voice_profile_id=profile.id,
        user_id=profile.user_id,
        past_posts=profile.past_posts,
        post_count=len(profile.past_posts),
        created_at=profile.created_at,
    )
