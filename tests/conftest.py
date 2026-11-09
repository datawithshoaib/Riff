"""Shared pytest fixtures.

Environment variables are set before importing the app so settings, the engine
and the provider factory are configured for offline, in-memory tests.
"""

from __future__ import annotations

import io
import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("AUTO_CREATE_TABLES", "false")
os.environ.setdefault("VISION_PROVIDER", "stub")
os.environ.setdefault("GENERATION_PROVIDER", "stub")
os.environ.setdefault("GROQ_API_KEY", "")

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import create_app
from app.models import Base


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session):
    application = create_app()

    def override_get_db():
        yield db_session

    application.dependency_overrides[get_db] = override_get_db
    with TestClient(application) as test_client:
        yield test_client
    application.dependency_overrides.clear()


@pytest.fixture()
def png_bytes() -> bytes:
    image = Image.new("RGB", (1200, 800), color=(24, 24, 28))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()
