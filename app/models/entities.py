"""SQLAlchemy entities.

Table names are kept stable so existing databases and Alembic revisions keep
working while the Python-side model names read cleanly.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_id


class VoiceProfile(Base, TimestampMixin):
    """A collection of the user's past posts, used as style reference only."""

    __tablename__ = "voice_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    past_posts: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    generations: Mapped[list[Generation]] = relationship(back_populates="voice_profile")


class Upload(Base, TimestampMixin):
    """A processed screenshot: extracted source text plus its abstraction."""

    __tablename__ = "upload_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    core_insight: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str | None] = mapped_column(String(64), nullable=True)

    generations: Mapped[list[Generation]] = relationship(
        back_populates="upload",
        cascade="all, delete-orphan",
    )


class Generation(Base, TimestampMixin):
    """One run of the generation pipeline."""

    __tablename__ = "generation_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    upload_id: Mapped[str] = mapped_column(
        ForeignKey("upload_records.id"), nullable=False, index=True
    )
    voice_profile_id: Mapped[str | None] = mapped_column(
        ForeignKey("voice_profiles.id"), nullable=True, index=True
    )

    drafts: Mapped[list[Any]] = mapped_column(JSON, nullable=False, default=list)
    flagged: Mapped[list[bool]] = mapped_column(JSON, nullable=False, default=list)

    upload: Mapped[Upload] = relationship(back_populates="generations")
    voice_profile: Mapped[VoiceProfile | None] = relationship(back_populates="generations")


# Backwards-compatible aliases for code written against the first iteration.
UploadRecord = Upload
GenerationRecord = Generation
