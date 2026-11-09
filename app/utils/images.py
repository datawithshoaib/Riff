"""Image validation and preprocessing for vision models.

Screenshots arrive in many formats and sizes. We normalise everything to a
reasonably sized JPEG, strip EXIF orientation, and reject oversized or invalid
files with a friendly error.
"""

from __future__ import annotations

import io
from dataclasses import dataclass

from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import settings
from app.core.exceptions import InvalidImageError

# Guard against decompression bombs from untrusted uploads.
Image.MAX_IMAGE_PIXELS = 40_000_000

ALLOWED_MEDIA_TYPES = {
    "image/jpeg": "JPEG",
    "image/jpg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
    "image/heic": "HEIC",
}

_OUTPUT_MEDIA_TYPE = "image/jpeg"


@dataclass(frozen=True, slots=True)
class ProcessedImage:
    data: bytes
    media_type: str
    width: int
    height: int


def preprocess_image(
    image_bytes: bytes,
    media_type: str | None = None,
    *,
    max_dimension: int | None = None,
    quality: int | None = None,
) -> ProcessedImage:
    """Validate, orient, downscale and re-encode an uploaded image."""
    if not image_bytes:
        raise InvalidImageError("The uploaded file is empty.")

    if len(image_bytes) > settings.MAX_UPLOAD_BYTES:
        limit_mb = settings.MAX_UPLOAD_BYTES / (1024 * 1024)
        raise InvalidImageError(f"Images must be {limit_mb:.0f} MB or smaller.")

    normalised_type = (media_type or "").split(";")[0].strip().lower()
    if normalised_type and normalised_type not in ALLOWED_MEDIA_TYPES:
        raise InvalidImageError("Unsupported file type. Upload a PNG, JPEG or WebP screenshot.")

    try:
        with Image.open(io.BytesIO(image_bytes)) as probe:
            probe.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise InvalidImageError("That file does not look like a valid image.") from exc

    try:
        with Image.open(io.BytesIO(image_bytes)) as source:
            image = ImageOps.exif_transpose(source)
            image = image.convert("RGB")
            max_side = max_dimension or settings.VISION_MAX_DIMENSION
            image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

            output = io.BytesIO()
            image.save(
                output,
                format="JPEG",
                quality=quality or settings.VISION_JPEG_QUALITY,
                optimize=True,
            )
            return ProcessedImage(
                data=output.getvalue(),
                media_type=_OUTPUT_MEDIA_TYPE,
                width=image.width,
                height=image.height,
            )
    except InvalidImageError:
        raise
    except Exception as exc:  # Pillow surfaces many exception types
        raise InvalidImageError("The image could not be processed.") from exc
