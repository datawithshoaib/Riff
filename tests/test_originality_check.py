from app.core.originality import analyse, check_similarity, is_too_similar, phrase_overlap


def test_identical_text_is_flagged():
    text = "Consistency compounds in ways that motivation never will."
    result = analyse(text, text)
    assert result.similarity == 1.0
    assert result.flagged is True
    assert is_too_similar(text, text) is True


def test_different_text_is_not_flagged():
    original = "This is a very unique sentence about Riff and screenshots."
    generated = "Small daily reps beat occasional heroic effort, every single time."
    result = analyse(original, generated)
    assert result.similarity < 0.5
    assert result.flagged is False


def test_phrase_overlap_catches_verbatim_copy():
    original = "The fastest way to get started is to make the first step embarrassingly small."
    generated = (
        "Honestly, the fastest way to get started is to make the first step "
        "embarrassingly small."
    )
    assert phrase_overlap(original, generated) > 0.4
    assert analyse(original, generated).flagged is True


def test_similarity_is_bounded():
    score = check_similarity("", "anything")
    assert score == 0.0


def test_threshold_is_configurable():
    original = "A calm, deliberate morning routine changes the shape of the whole day."
    generated = "A calm, deliberate morning routine shapes the entire day."
    assert is_too_similar(original, generated, threshold=0.99) is False
