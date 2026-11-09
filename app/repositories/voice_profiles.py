"""Data access for voice profiles."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import VoiceProfile


class VoiceProfileRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, *, user_id: str, past_posts: list[str]) -> VoiceProfile:
        profile = VoiceProfile(user_id=user_id, past_posts=past_posts)
        self._db.add(profile)
        self._db.commit()
        self._db.refresh(profile)
        return profile

    def get(self, profile_id: str) -> VoiceProfile | None:
        return self._db.get(VoiceProfile, profile_id)

    def list_for_user(self, user_id: str) -> list[VoiceProfile]:
        stmt = (
            select(VoiceProfile)
            .where(VoiceProfile.user_id == user_id)
            .order_by(VoiceProfile.created_at.desc())
        )
        return list(self._db.scalars(stmt).all())

    def update_posts(self, profile: VoiceProfile, posts: list[str]) -> VoiceProfile:
        profile.past_posts = posts
        self._db.commit()
        self._db.refresh(profile)
        return profile
