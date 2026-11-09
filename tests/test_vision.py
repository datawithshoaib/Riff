import pytest

from app.core.vision import extract_insight


@pytest.mark.asyncio
async def test_extract_insight_returns_expected_shape():
    result = await extract_insight(b"demo", "image/jpeg")
    assert set(result) == {"raw_text", "core_insight", "tone"}
    assert result["core_insight"]
    assert result["tone"]
