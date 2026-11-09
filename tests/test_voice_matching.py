from app.core.voice_matching import select_voice_examples


def test_returns_all_posts_when_under_limit():
    posts = ["one post", "another post"]
    assert select_voice_examples(posts, "insight", limit=3) == posts


def test_prefers_posts_relevant_to_the_insight():
    posts = [
        "A recipe for sourdough bread with a long cold ferment.",
        "Hiring is a compounding system: small culture decisions become the company.",
        "My favourite travel route through northern Italy.",
    ]
    selected = select_voice_examples(
        posts,
        "Company culture and hiring compound over time.",
        limit=1,
    )
    assert selected == [posts[1]]


def test_ignores_blank_posts():
    assert select_voice_examples(["", "   ", "real post"], "anything", limit=3) == ["real post"]


def test_zero_limit_returns_nothing():
    assert select_voice_examples(["post"], "insight", limit=0) == []
