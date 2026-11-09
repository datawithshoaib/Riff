"""Provider interfaces for vision extraction and post generation."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class VisionResult:
    raw_text: str
    core_insight: str
    tone: str = "neutral"


class VisionProvider(ABC):
    """Turns a screenshot into literal text and an abstracted core insight."""

    name: str = "base"

    @abstractmethod
    async def extract(self, image_bytes: bytes, media_type: str) -> VisionResult:
        """Return the source text, insight and tone for an image."""


class GenerationProvider(ABC):
    """Writes original drafts from an insight, optionally matching a voice."""

    name: str = "base"

    @abstractmethod
    async def generate_posts(
        self,
        *,
        insight: str,
        voice_examples: list[str],
        count: int,
    ) -> list[str]:
        """Return up to ``count`` original posts."""
