import io

import pytest
from PIL import Image

from app.core.exceptions import InvalidImageError
from app.utils.images import preprocess_image


def _image_bytes(size: tuple[int, int], fmt: str = "PNG") -> bytes:
    image = Image.new("RGB", size, color=(10, 10, 12))
    buffer = io.BytesIO()
    image.save(buffer, format=fmt)
    return buffer.getvalue()


def test_downscales_large_images():
    processed = preprocess_image(_image_bytes((3000, 2000)), "image/png", max_dimension=1000)
    assert processed.media_type == "image/jpeg"
    assert max(processed.width, processed.height) <= 1000
    assert processed.data.startswith(b"\xff\xd8")


def test_rejects_non_image_payloads():
    with pytest.raises(InvalidImageError):
        preprocess_image(b"not an image", "image/png")


def test_rejects_unsupported_media_types():
    with pytest.raises(InvalidImageError):
        preprocess_image(_image_bytes((10, 10)), "application/pdf")


def test_rejects_empty_payloads():
    with pytest.raises(InvalidImageError):
        preprocess_image(b"", "image/png")
