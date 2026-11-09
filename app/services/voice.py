"""Use case: manage a user's voice profiles."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.entities import VoiceProfile
from app.repositories.voice_profiles import VoiceProfileRepository


class VoiceService:
    def __init__(self, db: Session) -> None:
        self._profiles = VoiceProfileRepository(db)

    def create(self, *, user_id: str, past_posts: list[str]) -> VoiceProfile:
        return self._profiles.create(user_id=user_id, past_posts=past_posts)

    def get(self, profile_id: str) -> VoiceProfile:
        profile = self._profiles.get(profile_id)
        if profile is None:
            raise NotFoundError("That voice profile could not be found.")
        return profile

    def list_for_user(self, user_id: str) -> list[VoiceProfile]:
        return self._profiles.list_for_user(user_id)

    def update(self, profile_id: str, past_posts: list[str]) -> VoiceProfile:
        profile = self.get(profile_id)
        return self._profiles.update_posts(profile, past_posts)
