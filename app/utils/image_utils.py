"""Compatibility shim for the original image helper module."""

from app.utils.images import ALLOWED_MEDIA_TYPES, ProcessedImage, preprocess_image

__all__ = ["ALLOWED_MEDIA_TYPES", "ProcessedImage", "preprocess_image"]
