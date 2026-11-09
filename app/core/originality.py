"""Pure-Python originality checks.

Two independent signals guard against accidentally republishing the source:

* **Similarity** — cosine similarity over content-word frequencies.
* **Phrase overlap** — how much of the generated n-gram set also appears in the
  source, which catches near-verbatim phrases that bag-of-words similarity
  misses.

Both are deliberately dependency-free so the API starts instantly and tests do
not download model weights. An embedding-based signal can be layered on later
behind the same ``OriginalityResult`` contract.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass

from app.config import settings

_WORD_RE = re.compile(r"[a-z0-9']+")

_STOPWORD_TEXT = """
a about above after again against all am an and any are as at be because been before
being below between both but by can could did do does doing down during each few for
from further had has have having he her here hers herself him himself his how i if in
into is it its itself just me more most my myself no nor not now of off on once only
or other our ours ourselves out over own same she should so some such than that the
their theirs them themselves then there these they this those through to too under
until up very was we were what when where which while who whom why will with you
your yours yourself yourselves
"""
_STOPWORDS = frozenset(_STOPWORD_TEXT.split())


def tokenize(text: str) -> list[str]:
    """Lowercase content words, dropping stopwords and single characters."""
    return [
        token
        for token in _WORD_RE.findall(text.lower())
        if len(token) > 1 and token not in _STOPWORDS
    ]


def _term_vector(tokens: list[str]) -> Counter[str]:
    return Counter(tokens)


def check_similarity(original: str, generated: str) -> float:
    """Cosine similarity between two texts' content-word distributions (0-1)."""
    original_vec = _term_vector(tokenize(original))
    generated_vec = _term_vector(tokenize(generated))
    if not original_vec or not generated_vec:
        return 0.0

    common = set(original_vec) & set(generated_vec)
    numerator = sum(original_vec[t] * generated_vec[t] for t in common)
    denominator = math.sqrt(sum(v * v for v in original_vec.values())) * math.sqrt(
        sum(v * v for v in generated_vec.values())
    )
    if denominator == 0:
        return 0.0
    return round(min(1.0, numerator / denominator), 4)


def _ngrams(tokens: list[str], size: int) -> set[tuple[str, ...]]:
    if len(tokens) < size:
        return set()
    return {tuple(tokens[i : i + size]) for i in range(len(tokens) - size + 1)}


def phrase_overlap(original: str, generated: str, size: int = 4) -> float:
    """Share of generated word n-grams that also occur in the source (0-1)."""
    generated_ngrams = _ngrams(tokenize(generated), size)
    if not generated_ngrams:
        return 0.0
    original_ngrams = _ngrams(tokenize(original), size)
    if not original_ngrams:
        return 0.0
    return round(len(generated_ngrams & original_ngrams) / len(generated_ngrams), 4)


@dataclass(frozen=True, slots=True)
class OriginalityResult:
    text: str
    similarity: float
    phrase_overlap: float
    flagged: bool
    word_count: int

    def as_dict(self) -> dict[str, object]:
        return {
            "text": self.text,
            "similarity": self.similarity,
            "phrase_overlap": self.phrase_overlap,
            "flagged": self.flagged,
            "word_count": self.word_count,
        }


def analyse(
    original: str,
    generated: str,
    *,
    similarity_threshold: float | None = None,
    overlap_threshold: float | None = None,
) -> OriginalityResult:
    similarity = check_similarity(original, generated)
    overlap = phrase_overlap(original, generated)
    sim_limit = (
        similarity_threshold
        if similarity_threshold is not None
        else settings.SIMILARITY_THRESHOLD
    )
    overlap_limit = (
        overlap_threshold
        if overlap_threshold is not None
        else settings.NGRAM_OVERLAP_THRESHOLD
    )

    flagged = similarity > sim_limit or overlap >= overlap_limit
    return OriginalityResult(
        text=generated.strip(),
        similarity=similarity,
        phrase_overlap=overlap,
        flagged=flagged,
        word_count=len(generated.split()),
    )


def is_too_similar(
    original: str,
    generated: str,
    threshold: float | None = None,
) -> bool:
    """Backwards-compatible boolean gate used by callers and tests."""
    return analyse(
        original,
        generated,
        similarity_threshold=threshold,
    ).flagged if threshold is not None else analyse(original, generated).flagged
