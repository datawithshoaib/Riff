"""Domain exceptions mapped to HTTP responses by the API layer."""

from __future__ import annotations


class RiffError(Exception):
    """Base class for expected, user-facing failures."""

    status_code = 400
    code = "riff_error"

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        code: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code


class NotFoundError(RiffError):
    status_code = 404
    code = "not_found"


class InvalidImageError(RiffError):
    status_code = 422
    code = "invalid_image"


class ConfigurationError(RiffError):
    status_code = 500
    code = "configuration_error"


class ProviderError(RiffError):
    """The upstream vision/generation model failed."""

    status_code = 502
    code = "provider_error"
