"""Offline demo providers.

They let the full product run without API keys, so the UI and pipeline can be
explored end to end. Health reporting marks these responses as demo mode.
"""

from __future__ import annotations

from app.core.providers.base import GenerationProvider, VisionProvider, VisionResult

_DEMO_INSIGHT = (
    "Small, visible repetitions compound into outsized results, while waiting for "
    "a perfect plan quietly guarantees nothing changes."
)

_DEMO_RAW_TEXT = (
    "[Demo mode] Connect a Groq API key to read the real screenshot.\n\n"
    "\"You do not need a bigger plan. You need a smaller first step you can repeat tomorrow.\""
)


class StubVisionProvider(VisionProvider):
    name = "demo"

    async def extract(self, image_bytes: bytes, media_type: str) -> VisionResult:
        return VisionResult(
            raw_text=_DEMO_RAW_TEXT,
            core_insight=_DEMO_INSIGHT,
            tone="motivational",
        )


class StubGenerationProvider(GenerationProvider):
    name = "demo"

    async def generate_posts(
        self,
        *,
        insight: str,
        voice_examples: list[str],
        count: int,
    ) -> list[str]:
        opening = insight.rstrip(".")
        drafts = [
            (
                f"{opening}.\n\n"
                "We usually answer that with a bigger plan. A longer notion doc. A calendar "
                "block called \"strategy\".\n\n"
                "But momentum does not come from plans. It comes from reps you can see: "
                "one post, one call, one shipped change.\n\n"
                "Make the next rep small enough that skipping it feels sillier than doing it."
            ),
            (
                "Nobody quits because the goal was too small.\n\n"
                "They quit because the first step looked like a mountain and the reward lived "
                "somewhere past the clouds.\n\n"
                "So shrink the step. Not the ambition — the step.\n\n"
                "Then do it again tomorrow, while everyone else is still designing the mountain."
            ),
            (
                "A year from now, the difference between two people won't be talent.\n\n"
                "It'll be the boring stuff: who kept showing up on the days it wasn't fun, "
                "who shipped the imperfect version, who let the work be seen before it "
                "was ready.\n\n"
                "Consistency isn't a personality trait. It's a decision you re-make every morning."
            ),
        ]
        if voice_examples:
            drafts = [
                draft
                + "\n\n(Style reference applied in demo mode. "
                "Connect an API key for a real match.)"
                for draft in drafts
            ]
        return drafts[:count]
