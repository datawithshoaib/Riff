"""Generation endpoints: three drafts from a stored insight."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.api.deps import GenerationServiceDep, PaginationDep
from app.api.serializers import generation_to_response, generation_to_summary
from app.models.schemas import (
    GenerateRequest,
    GenerateResponse,
    GenerationListResponse,
)

router = APIRouter(prefix="/generations", tags=["generations"])


@router.post(
    "",
    response_model=GenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate original drafts for an upload",
)
async def create_generation(
    payload: GenerateRequest,
    service: GenerationServiceDep,
) -> GenerateResponse:
    generation = await service.generate(
        upload_id=payload.upload_id,
        voice_profile_id=payload.voice_profile_id,
        draft_count=payload.draft_count,
    )
    return generation_to_response(generation)


@router.get("", response_model=GenerationListResponse, summary="List past generations")
def list_generations(
    pagination: PaginationDep,
    service: GenerationServiceDep,
) -> GenerationListResponse:
    generations, total = service.list(limit=pagination.limit, offset=pagination.offset)
    return GenerationListResponse(
        items=[generation_to_summary(generation) for generation in generations],
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get("/{generation_id}", response_model=GenerateResponse, summary="Get a generation")
def get_generation(
    generation_id: str,
    service: GenerationServiceDep,
) -> GenerateResponse:
    return generation_to_response(service.get(generation_id))
