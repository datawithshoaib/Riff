"""Provider selection based on settings.

``auto`` prefers Groq when an API key exists and falls back to the offline demo
provider otherwise. Unknown provider names fail fast with a configuration
error rather than silently degrading.
"""

from __future__ import annotations

import logging

from app.config import settings
from app.core.exceptions import ConfigurationError
from app.core.providers.base import GenerationProvider, VisionProvider

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ("auto", "groq", "stub")


def _resolve(configured: str) -> str:
    name = (configured or "auto").strip().lower()
    if name not in SUPPORTED_PROVIDERS:
        supported = ", ".join(SUPPORTED_PROVIDERS)
        raise ConfigurationError(f"Unknown provider '{configured}'. Supported values: {supported}.")

    has_key = bool(settings.GROQ_API_KEY.strip())
    if name == "auto":
        return "groq" if has_key else "stub"
    if name == "groq" and not has_key:
        logger.warning("Groq selected without GROQ_API_KEY; falling back to the demo provider.")
        return "stub"
    return name


def get_vision_provider() -> VisionProvider:
    name = _resolve(settings.VISION_PROVIDER)
    if name == "groq":
        from app.core.providers.groq import GroqVisionProvider

        return GroqVisionProvider(settings.GROQ_API_KEY, settings.GROQ_VISION_MODEL)

    from app.core.providers.stub import StubVisionProvider

    return StubVisionProvider()


def get_generation_provider() -> GenerationProvider:
    name = _resolve(settings.GENERATION_PROVIDER)
    if name == "groq":
        from app.core.providers.groq import GroqGenerationProvider

        return GroqGenerationProvider(settings.GROQ_API_KEY, settings.GROQ_GENERATION_MODEL)

    from app.core.providers.stub import StubGenerationProvider

    return StubGenerationProvider()


def provider_status() -> dict[str, str]:
    """Names used by the health endpoint, without constructing clients."""
    vision = _resolve(settings.VISION_PROVIDER)
    generation = _resolve(settings.GENERATION_PROVIDER)
    display = {"stub": "demo", "groq": "groq"}
    return {
        "vision_provider": display[vision],
        "generation_provider": display[generation],
        "mode": "demo" if "stub" in (vision, generation) else "live",
    }
