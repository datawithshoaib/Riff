"""Compatibility shim.

Older modules imported models from ``app.models.db_models``. The canonical
location is now ``app.models.entities``; this module keeps those imports working.
"""

from app.models.base import Base
from app.models.entities import (
    Generation,
    GenerationRecord,
    Upload,
    UploadRecord,
    VoiceProfile,
)

__all__ = [
    "Base",
    "Generation",
    "GenerationRecord",
    "Upload",
    "UploadRecord",
    "VoiceProfile",
]
