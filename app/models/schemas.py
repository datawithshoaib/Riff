"""Pydantic request/response models shared by the API layer."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UploadResponse(APIModel):
    upload_id: str
    raw_text: str
    core_insight: str
    tone: str | None = None
    created_at: datetime | None = None


class UploadListResponse(APIModel):
    items: list[UploadResponse]
    total: int
    limit: int
    offset: int


class GenerateRequest(APIModel):
    upload_id: str = Field(min_length=1, max_length=64)
    voice_profile_id: str | None = Field(default=None, max_length=64)
    draft_count: int | None = Field(default=None, ge=1, le=6)


class DraftResponse(APIModel):
    text: str
    flagged: bool = False
    similarity: float = 0.0
    phrase_overlap: float = 0.0
    word_count: int = 0


class GenerateResponse(APIModel):
    generation_id: str
    upload_id: str
    core_insight: str
    tone: str | None = None
    drafts: list[DraftResponse]
    created_at: datetime | None = None


class GenerationSummary(APIModel):
    generation_id: str
    upload_id: str
    core_insight: str
    tone: str | None = None
    draft_count: int = 0
    flagged_count: int = 0
    preview: str = ""
    created_at: datetime | None = None


class GenerationListResponse(APIModel):
    items: list[GenerationSummary]
    total: int
    limit: int
    offset: int


class VoiceProfileCreate(APIModel):
    user_id: str = Field(min_length=1, max_length=128)
    past_posts: list[str] = Field(min_length=1, max_length=20)

    @field_validator("past_posts")
    @classmethod
    def clean_posts(cls, posts: list[str]) -> list[str]:
        return _normalise_posts(posts)


class VoiceProfileUpdate(APIModel):
    past_posts: list[str] = Field(min_length=1, max_length=20)

    @field_validator("past_posts")
    @classmethod
    def clean_posts(cls, posts: list[str]) -> list[str]:
        return _normalise_posts(posts)


class VoiceProfileResponse(APIModel):
    voice_profile_id: str
    user_id: str
    past_posts: list[str]
    post_count: int
    created_at: datetime | None = None


class HealthResponse(APIModel):
    status: str = "ok"
    version: str
    environment: str
    mode: str
    vision_provider: str
    generation_provider: str
    database: str
    similarity_threshold: float


class ErrorResponse(APIModel):
    detail: str
    code: str = "error"


def _normalise_posts(posts: list[str]) -> list[str]:
    seen: set[str] = set()
    cleaned: list[str] = []
    for post in posts:
        text = post.strip()
        if not text or text in seen:
            continue
        if len(text) > 5000:
            raise ValueError("Each past post must be 5000 characters or fewer.")
        seen.add(text)
        cleaned.append(text)
    if not cleaned:
        raise ValueError("Provide at least one non-empty past post.")
    return cleaned
