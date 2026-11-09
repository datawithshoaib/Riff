"""Vision step: screenshot -> literal text, abstracted insight and tone."""

from __future__ import annotations

import logging

from app.core.exceptions import ProviderError
from app.core.providers import get_vision_provider

logger = logging.getLogger(__name__)


async def extract_insight(image_bytes: bytes, media_type: str = "image/jpeg") -> dict[str, str]:
    """Run the configured vision provider and validate its response."""
    provider = get_vision_provider()
    logger.info("Extracting insight with provider=%s", provider.name)

    result = await provider.extract(image_bytes, media_type)

    raw_text = (result.raw_text or "").strip()
    core_insight = (result.core_insight or "").strip()
    tone = (result.tone or "neutral").strip()

    if not core_insight:
        raise ProviderError("No core insight could be extracted from that image.")

    return {
        "raw_text": raw_text or core_insight,
        "core_insight": core_insight,
        "tone": tone,
    }
