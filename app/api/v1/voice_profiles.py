"""Voice profile endpoints: the user's own posts, used as style reference."""

from __future__ import annotations

from fastapi import APIRouter, Query, status

from app.api.deps import VoiceServiceDep
from app.api.serializers import voice_profile_to_response
from app.models.schemas import (
    VoiceProfileCreate,
    VoiceProfileResponse,
    VoiceProfileUpdate,
)

router = APIRouter(prefix="/voice-profiles", tags=["voice"])


@router.post(
    "",
    response_model=VoiceProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a voice profile",
)
def create_voice_profile(
    payload: VoiceProfileCreate,
    service: VoiceServiceDep,
) -> VoiceProfileResponse:
    profile = service.create(user_id=payload.user_id, past_posts=payload.past_posts)
    return voice_profile_to_response(profile)


@router.get("", response_model=list[VoiceProfileResponse], summary="List voice profiles")
def list_voice_profiles(
    service: VoiceServiceDep,
    user_id: str = Query(..., min_length=1, max_length=128),
) -> list[VoiceProfileResponse]:
    profiles = service.list_for_user(user_id)
    return [voice_profile_to_response(profile) for profile in profiles]


@router.get("/{profile_id}", response_model=VoiceProfileResponse, summary="Get a voice profile")
def get_voice_profile(
    profile_id: str,
    service: VoiceServiceDep,
) -> VoiceProfileResponse:
    return voice_profile_to_response(service.get(profile_id))


@router.patch(
    "/{profile_id}",
    response_model=VoiceProfileResponse,
    summary="Replace the posts in a voice profile",
)
def update_voice_profile(
    profile_id: str,
    payload: VoiceProfileUpdate,
    service: VoiceServiceDep,
) -> VoiceProfileResponse:
    profile = service.update(profile_id, payload.past_posts)
    return voice_profile_to_response(profile)
