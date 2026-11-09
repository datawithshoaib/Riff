"""Upload endpoints: screenshot in, extracted insight out."""

from __future__ import annotations

from fastapi import APIRouter, File, UploadFile, status

from app.api.deps import IngestionServiceDep, PaginationDep
from app.api.serializers import upload_to_response
from app.models.schemas import UploadListResponse, UploadResponse

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a screenshot and extract its insight",
)
async def create_upload(
    service: IngestionServiceDep,
    file: UploadFile = File(..., description="PNG, JPEG or WebP screenshot"),
) -> UploadResponse:
    data = await file.read()
    result = await service.ingest(
        filename=file.filename,
        content_type=file.content_type,
        data=data,
    )
    return upload_to_response(result.upload)


@router.get("", response_model=UploadListResponse, summary="List recent uploads")
def list_uploads(
    pagination: PaginationDep,
    service: IngestionServiceDep,
) -> UploadListResponse:
    uploads, total = service.list(limit=pagination.limit, offset=pagination.offset)
    return UploadListResponse(
        items=[upload_to_response(upload) for upload in uploads],
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get("/{upload_id}", response_model=UploadResponse, summary="Get an upload")
def get_upload(
    upload_id: str,
    service: IngestionServiceDep,
) -> UploadResponse:
    return upload_to_response(service.get(upload_id))
