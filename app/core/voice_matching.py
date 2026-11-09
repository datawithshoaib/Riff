"""Voice matching: pick the user's past posts most relevant to an insight.

Style references are chosen by lexical relevance to the insight, with a small
recency bonus. This keeps the pipeline dependency-free while still giving the
generator useful, varied examples.
"""

from __future__ import annotations

from app.core.originality import check_similarity, tokenize


def _score(post: str, insight: str) -> float:
    return check_similarity(insight, post)


def select_voice_examples(
    past_posts: list[str],
    insight: str,
    limit: int = 3,
) -> list[str]:
    """Return up to ``limit`` representative posts, most relevant first."""
    cleaned = [post.strip() for post in past_posts if post and post.strip()]
    if not cleaned or limit <= 0:
        return []
    if len(cleaned) <= limit:
        return cleaned

    scored = [(_score(post, insight), index, post) for index, post in enumerate(cleaned)]
    # Relevance first; newer posts (higher index) break ties.
    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [post for _, _, post in scored[:limit]]


def get_voice_examples(
    posts: list[str] | None,
    insight: str = "",
    limit: int = 3,
) -> list[str]:
    """Compatibility wrapper around :func:`select_voice_examples`."""
    return select_voice_examples(posts or [], insight, limit)


def post_tokens(post: str) -> list[str]:
    """Expose tokenisation for callers that want to inspect a profile."""
    return tokenize(post)
