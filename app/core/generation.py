"""Generation step: insight + style references -> originality-checked drafts.

The raw screenshot text never reaches the generation prompt. It is used only by
the originality gate, which runs after generation.
"""

from __future__ import annotations

import logging

from app.config import settings
from app.core.originality import analyse
from app.core.providers import get_generation_provider

logger = logging.getLogger(__name__)


async def generate_and_check(
    insight: str,
    voice_examples: list[str],
    raw_text: str,
    count: int | None = None,
) -> dict[str, object]:
    """Generate drafts and score each against the original source text."""
    provider = get_generation_provider()
    draft_count = count or settings.DRAFT_COUNT
    logger.info(
        "Generating %s drafts with provider=%s voice_samples=%s",
        draft_count,
        provider.name,
        len(voice_examples),
    )

    posts = await provider.generate_posts(
        insight=insight,
        voice_examples=voice_examples,
        count=draft_count,
    )

    unique_posts: list[str] = []
    seen: set[str] = set()
    for post in posts:
        cleaned = post.strip()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        unique_posts.append(cleaned)

    results = [analyse(raw_text, post) for post in unique_posts]
    drafts = [result.as_dict() for result in results]

    return {
        "drafts": drafts,
        "flagged": [result.flagged for result in results],
    }
