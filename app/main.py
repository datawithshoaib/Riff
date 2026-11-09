"""Riff API application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import settings
from app.core.exceptions import RiffError
from app.core.providers import provider_status
from app.db.session import init_db
from app.logging_config import configure_logging
from app.models.schemas import HealthResponse

logger = logging.getLogger("riff")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    configure_logging()
    if settings.is_sqlite and settings.AUTO_CREATE_TABLES:
        init_db()

    status = provider_status()
    logger.info(
        "%s v%s starting | env=%s | mode=%s | vision=%s | generation=%s",
        settings.APP_NAME,
        settings.VERSION,
        settings.ENVIRONMENT,
        status["mode"],
        status["vision_provider"],
        status["generation_provider"],
    )
    if status["mode"] == "demo":
        logger.info("Demo mode: set GROQ_API_KEY in .env to use live vision and generation.")

    yield

    logger.info("%s shutting down", settings.APP_NAME)


def create_app() -> FastAPI:
    configure_logging()
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description=(
            "Turn a screenshot of someone else's post into original drafts in your own voice. "
            "The pipeline extracts an abstract insight, never forwards the source text to the "
            "writer, and scores every draft for originality."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
        openapi_tags=[
            {"name": "system", "description": "Health and service metadata."},
            {"name": "uploads", "description": "Screenshot ingestion and insight extraction."},
            {"name": "generations", "description": "Draft generation and history."},
            {"name": "voice", "description": "The user's own writing, used as style reference."},
        ],
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.API_PREFIX)

    @application.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "name": settings.APP_NAME,
            "version": settings.VERSION,
            "api": settings.API_PREFIX,
            "docs": "/docs",
            "health": f"{settings.API_PREFIX}/health",
        }

    @application.get(
        "/health",
        response_model=HealthResponse,
        tags=["system"],
        include_in_schema=False,
    )
    def legacy_health() -> HealthResponse:
        status = provider_status()
        return HealthResponse(
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            mode=status["mode"],
            vision_provider=status["vision_provider"],
            generation_provider=status["generation_provider"],
            database="sqlite" if settings.is_sqlite else "postgresql",
            similarity_threshold=settings.SIMILARITY_THRESHOLD,
        )

    @application.exception_handler(RiffError)
    async def riff_error_handler(_request: Request, exc: RiffError) -> JSONResponse:
        logger.info("Handled error %s: %s", exc.code, exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        detail = "The request could not be validated."
        if errors:
            first = errors[0]
            location = ".".join(
                str(part)
                for part in first.get("loc", ())
                if part not in {"body", "query", "path"}
            )
            message = str(first.get("msg", "Invalid value"))
            detail = f"{location}: {message}" if location else message
        return JSONResponse(
            status_code=422,
            content={"detail": detail, "code": "validation_error"},
        )

    @application.exception_handler(Exception)
    async def unhandled_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Something went wrong on our side. Please try again.",
                "code": "internal_error",
            },
        )

    return application


app = create_app()
