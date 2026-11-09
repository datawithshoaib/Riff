"""Aggregated v1 router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import generations, health, uploads, voice_profiles

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(uploads.router)
api_router.include_router(generations.router)
api_router.include_router(voice_profiles.router)
