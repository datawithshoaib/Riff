"""Small, tolerant helpers for parsing model output."""

from __future__ import annotations

import json
import re
from typing import Any

_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def loads_json(text: str) -> Any | None:
    """Parse JSON, tolerating markdown fences and surrounding prose."""
    if not text:
        return None

    candidates: list[str] = [text.strip()]

    fenced = _FENCE_RE.search(text)
    if fenced:
        candidates.append(fenced.group(1).strip())

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        candidates.append(text[start : end + 1])

    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end > start:
        candidates.append(text[start : end + 1])

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, TypeError):
            continue
    return None


def split_drafts(text: str) -> list[str]:
    """Split a plain-text response on common draft delimiters."""
    parts = re.split(
        r"-{2,}\s*DRAFT\s*-{2,}|^\s*Draft\s+\d+\s*:?\s*$",
        text,
        flags=re.MULTILINE | re.IGNORECASE,
    )
    return [part.strip(" \n-") for part in parts if part and part.strip(" \n-")]
