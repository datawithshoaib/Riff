"""Backwards-compatible import for the originality check."""

from app.core.originality import (
    OriginalityResult,
    analyse,
    check_similarity,
    is_too_similar,
    phrase_overlap,
    tokenize,
)

__all__ = [
    "OriginalityResult",
    "analyse",
    "check_similarity",
    "is_too_similar",
    "phrase_overlap",
    "tokenize",
]
