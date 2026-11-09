import pytest

from app.core.generation import generate_and_check


@pytest.mark.asyncio
async def test_generate_and_check_returns_scored_drafts():
    result = await generate_and_check(
        insight="Small consistent reps beat occasional big swings.",
        voice_examples=["I write in short, direct sentences."],
        raw_text="Some completely different source material about morning routines.",
        count=3,
    )

    assert len(result["drafts"]) == 3
    assert len(result["flagged"]) == 3
    for draft in result["drafts"]:
        assert draft["text"]
        assert 0.0 <= draft["similarity"] <= 1.0
        assert 0.0 <= draft["phrase_overlap"] <= 1.0
        assert draft["word_count"] > 0


@pytest.mark.asyncio
async def test_flagged_when_source_is_reused():
    source = "Motivation is unreliable. Systems are what carry you when the mood is gone."
    result = await generate_and_check(
        insight=source,
        voice_examples=[],
        raw_text=source,
        count=1,
    )
    # Demo drafts are original, so this asserts the gate can distinguish them.
    assert result["flagged"] == [False]
