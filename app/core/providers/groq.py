"""Groq-backed providers (OpenAI-compatible chat completions).

Uses the official ``groq`` SDK directly — the pipeline is two sequential calls,
so an orchestration framework would only add indirection.
"""

from __future__ import annotations

import base64
import logging

from groq import APIError, AsyncGroq

from app.core.exceptions import ProviderError
from app.core.providers.base import GenerationProvider, VisionProvider, VisionResult
from app.core.providers.utils import loads_json, split_drafts

logger = logging.getLogger(__name__)

_VISION_PROMPT = (
    "You are an OCR and insight-extraction engine. Read the screenshot carefully.\n\n"
    "1. Transcribe the literal text exactly as written in the image, preserving line breaks. "
    "If there is no readable text, describe the visual content briefly.\n"
    "2. In ONE abstract sentence, state the core underlying insight or idea. "
    "Do not reuse the author's distinctive phrasing; generalise the idea.\n"
    "3. Name the tone in two or three words (for example: witty, contrarian, motivational).\n\n"
    "Respond with JSON only, exactly this shape:\n"
    '{"raw_text": "...", "core_insight": "...", "tone": "..."}'
)

_GENERATION_SYSTEM = (
    "You are an expert ghostwriter for social media. You write in the user's own voice, "
    "with concrete detail, a clear point of view and no filler. "
    "You never copy or closely paraphrase other people's writing."
)


class GroqVisionProvider(VisionProvider):
    name = "groq"

    def __init__(self, api_key: str, model: str) -> None:
        if not api_key:
            raise ProviderError("GROQ_API_KEY is required for the Groq vision provider.")
        self._client = AsyncGroq(api_key=api_key)
        self._model = model

    async def extract(self, image_bytes: bytes, media_type: str) -> VisionResult:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        try:
            completion = await self._client.chat.completions.create(
                model=self._model,
                temperature=0.0,
                max_completion_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": _VISION_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{media_type};base64,{encoded}"},
                            },
                        ],
                    }
                ],
            )
        except APIError as exc:
            logger.warning("Groq vision request failed: %s", exc)
            raise ProviderError("The vision model could not read that screenshot.") from exc

        content = (completion.choices[0].message.content or "").strip()
        parsed = loads_json(content)

        if isinstance(parsed, dict):
            raw_text = str(parsed.get("raw_text") or "").strip()
            insight = str(parsed.get("core_insight") or "").strip()
            tone = str(parsed.get("tone") or "neutral").strip()
        else:
            # Graceful degradation: keep the transcription even if JSON failed.
            raw_text, insight, tone = content, content[:280], "neutral"

        if not insight:
            raise ProviderError("The vision model returned no insight. Try a clearer screenshot.")

        return VisionResult(raw_text=raw_text, core_insight=insight, tone=tone or "neutral")


class GroqGenerationProvider(GenerationProvider):
    name = "groq"

    def __init__(self, api_key: str, model: str) -> None:
        if not api_key:
            raise ProviderError("GROQ_API_KEY is required for the Groq generation provider.")
        self._client = AsyncGroq(api_key=api_key)
        self._model = model

    async def generate_posts(
        self,
        *,
        insight: str,
        voice_examples: list[str],
        count: int,
    ) -> list[str]:
        voice_block = ""
        if voice_examples:
            formatted = "\n\n".join(
                f"--- voice sample {index} ---\n{sample}"
                for index, sample in enumerate(voice_examples, 1)
            )
            voice_block = (
                "Use these past posts by the user ONLY as a style reference. "
                "Match their cadence, structure and vocabulary level, never their content.\n\n"
                f"{formatted}\n\n"
            )

        user_prompt = (
            f'Core insight to write about:\n"{insight}"\n\n'
            f"{voice_block}"
            f"Write exactly {count} distinct social posts about this insight. "
            "Give each a genuinely different angle, opening and structure. "
            "Vary length between short and medium. No hashtags unless the voice samples use them. "
            "Do not mention that this came from a screenshot.\n\n"
            "Respond with JSON only:\n"
            '{"drafts": ["first post", "second post", "third post"]}'
        )

        try:
            completion = await self._client.chat.completions.create(
                model=self._model,
                temperature=0.85,
                max_completion_tokens=1600,
                messages=[
                    {"role": "system", "content": _GENERATION_SYSTEM},
                    {"role": "user", "content": user_prompt},
                ],
            )
        except APIError as exc:
            logger.warning("Groq generation request failed: %s", exc)
            raise ProviderError("The writing model is unavailable right now. Try again.") from exc

        content = (completion.choices[0].message.content or "").strip()
        drafts = _extract_drafts(content)
        if not drafts:
            raise ProviderError("The writing model returned no drafts. Try again.")
        return drafts[:count]


def _extract_drafts(content: str) -> list[str]:
    parsed = loads_json(content)
    if isinstance(parsed, dict):
        raw = parsed.get("drafts") or parsed.get("posts")
        if isinstance(raw, list):
            return [str(item).strip() for item in raw if str(item).strip()]
        if isinstance(raw, str) and raw.strip():
            return [raw.strip()]
    if isinstance(parsed, list):
        return [str(item).strip() for item in parsed if str(item).strip()]
    return split_drafts(content)
