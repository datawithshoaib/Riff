# syntax=docker/dockerfile:1

FROM python:3.12-slim

# uv is the only dependency manager used in this image.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Dependency layer: install third-party packages without building the project.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Application layer.
COPY . .
RUN uv sync --frozen --no-dev

ENV ENVIRONMENT=production \
    AUTO_CREATE_TABLES=true

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
