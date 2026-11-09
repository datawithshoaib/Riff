"""Database engine, session factory and dev-time schema bootstrap."""

from __future__ import annotations

import logging
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

_connect_args: dict[str, object] = {}
if settings.is_sqlite:
    _connect_args["check_same_thread"] = False
    database_path = settings.DATABASE_URL.removeprefix("sqlite:///")
    if database_path and database_path != ":memory:":
        Path(database_path).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    future=True,
)

if settings.is_sqlite:

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables for a fresh SQLite database.

    Alembic remains the source of truth for schema changes; this only makes
    ``uvicorn app.main:app`` work on a clean checkout.
    """
    from app.models import Base

    Base.metadata.create_all(bind=engine)
    logger.info("Database schema ensured at %s", settings.DATABASE_URL)


def check_database() -> bool:
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
        return True
    except Exception:  # pragma: no cover - defensive
        logger.exception("Database health check failed")
        return False
