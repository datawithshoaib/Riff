# Riff — screenshot in, original post out

Riff turns a screenshot of someone else's post into three original drafts written in **your** voice. It keeps the idea, drops the wording, and checks every draft against the source before you ever see it.

- **Backend** — FastAPI, SQLAlchemy, `uv`-managed Python 3.11+
- **Frontend** — Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Providers** — Groq for vision + writing, with an offline demo mode so the app runs without an API key

---

## Why it isn't a paraphrase tool

1. The screenshot's **raw text never reaches the writing prompt**. Only an abstracted, one-sentence insight does.
2. Voice examples come from **your own past writing**, and are used as style reference only.
3. Every draft is scored against the source before it is returned:
   - **cosine similarity** over content-word frequencies, and
   - **4-gram phrase overlap**, which catches near-verbatim phrasing.
4. Drafts over either threshold are flagged so you can rewrite before publishing.

Both signals are dependency-free, so the API starts instantly and tests never download model weights.

---

## Architecture

```
Screenshot ──▶ image preprocessing ──▶ vision provider ──▶ raw_text + core_insight + tone
                                              │
                                              ▼
                         voice examples (your posts, style only)
                                              │
                                              ▼
                                    generation provider
                                              │
                                              ▼
                         originality gate (similarity + phrase overlap)
                                              │
                                              ▼
                                   3 scored drafts + flags
```

Request flow through the backend:

```
api/v1 routers → services → repositories → models
                       ↘ core (vision, generation, originality, providers)
```

Routes stay thin; services own use cases and transactions; repositories own queries.

---

## Project layout

```
Riff/
├── app/
│   ├── main.py                   # app factory, CORS, exception handlers, lifespan
│   ├── config.py                 # pydantic-settings, all runtime configuration
│   ├── logging_config.py
│   ├── api/
│   │   ├── deps.py               # DB, service and pagination dependencies
│   │   ├── serializers.py        # ORM → response mapping
│   │   ├── router.py             # aggregates /api/v1
│   │   └── v1/{health,uploads,generations,voice_profiles}.py
│   ├── services/                 # ingestion, generation, voice
│   ├── repositories/             # uploads, generations, voice profiles
│   ├── models/
│   │   ├── base.py               # SQLAlchemy Base
│   │   ├── entities.py           # ORM tables (names preserved for compatibility)
│   │   └── schemas.py            # Pydantic request/response models
│   ├── core/
│   │   ├── vision.py             # screenshot → insight
│   │   ├── generation.py         # insight → drafts → originality gate
│   │   ├── originality.py        # similarity + n-gram overlap
│   │   ├── voice_matching.py     # pick relevant style references
│   │   ├── exceptions.py
│   │   └── providers/
│   │       ├── base.py           # provider interfaces
│   │       ├── groq.py           # AsyncGroq implementation
│   │       ├── stub.py           # offline demo provider
│   │       └── factory.py        # auto | groq | stub resolution
│   ├── db/session.py             # engine, session factory, schema bootstrap
│   └── utils/images.py           # EXIF, RGB/JPEG, size/type validation
├── frontend/
│   ├── src/app/                  # /, /voice, /history, error/loading/not-found
│   ├── src/components/           # shell, studio, voice, history, ui (shadcn)
│   ├── src/lib/                  # API client, types, storage, formatting
│   ├── next.config.ts            # /api proxy rewrite, standalone output
│   └── Dockerfile
├── tests/                        # 24 tests, offline providers only
├── alembic/                      # migrations
├── pyproject.toml / uv.lock      # Python dependencies (uv)
├── Dockerfile                    # API image (uv sync --frozen)
├── docker-compose.yml            # api + web
└── .env.example
```

Compatibility shims remain for the original module paths: `app/core/originality_check.py`, `app/utils/image_utils.py` and `app/models/db_models.py`.

---

## Quick start

### 1. Backend

```bash
cp .env.example .env        # optional: add GROQ_API_KEY for live mode
uv sync                     # creates .venv and installs everything
uv run uvicorn app.main:app --reload
```

- API: <http://127.0.0.1:8000>
- Docs: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/api/v1/health>

The first run creates the SQLite schema automatically (`AUTO_CREATE_TABLES=true`) and logs the active mode.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. Next rewrites `/api/*` to `http://127.0.0.1:8000` by default. Point it elsewhere with:

```bash
API_PROXY_TARGET=http://127.0.0.1:8010 npm run dev
```

For a split deployment (separate origins), set `NEXT_PUBLIC_API_URL` at build time instead of relying on the rewrite.

### 3. Demo mode

With no `GROQ_API_KEY`, Riff automatically uses the offline demo provider. The full flow works — upload, insight, drafts, voice profiles, history — and the UI shows a **Demo mode** badge. Sample drafts are labelled so they are never mistaken for real output.

Set `GROQ_API_KEY` in `.env` and restart the API to switch to live vision and writing (`mode: "live"`).

---

## Configuration

All settings live in `app/config.py` and can be set via `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VISION_PROVIDER` | `auto` | `auto`, `groq` or `stub` |
| `GENERATION_PROVIDER` | `auto` | `auto`, `groq` or `stub` |
| `GROQ_API_KEY` | empty | Enables live mode when set |
| `GROQ_VISION_MODEL` | `qwen/qwen3.6-vl-27b` | Vision model |
| `GROQ_GENERATION_MODEL` | `llama-3.3-70b-versatile` | Writing model |
| `DATABASE_URL` | `sqlite:///./riff.db` | Any SQLAlchemy URL |
| `AUTO_CREATE_TABLES` | `true` | Create tables on startup (SQLite) |
| `CORS_ORIGINS` | localhost:3000/3001 | Comma-separated allowed origins |
| `MAX_UPLOAD_BYTES` | `10485760` | Upload size cap |
| `VISION_MAX_DIMENSION` | `1568` | Long-edge resize before the model |
| `DRAFT_COUNT` | `3` | Default drafts per generation |
| `VOICE_SAMPLE_LIMIT` | `3` | Style references per generation |
| `SIMILARITY_THRESHOLD` | `0.85` | Flag above this cosine similarity |
| `NGRAM_OVERLAP_THRESHOLD` | `0.40` | Flag above this 4-gram overlap |

`auto` resolves to Groq when a key exists and to the demo provider otherwise. An unknown provider fails fast with a configuration error rather than silently degrading.

---

## API

Base path: `/api/v1`. Errors use `{ "detail": "...", "code": "..." }`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Status, version, active mode and providers |
| `POST` | `/uploads` | Multipart `file`; returns `upload_id`, `raw_text`, `core_insight`, `tone` |
| `GET` | `/uploads` | Paginated uploads (`limit`, `offset`) |
| `GET` | `/uploads/{upload_id}` | One upload |
| `POST` | `/generations` | `{ upload_id, voice_profile_id?, draft_count? }` → scored drafts |
| `GET` | `/generations` | Paginated history with previews |
| `GET` | `/generations/{generation_id}` | Full generation |
| `POST` | `/voice-profiles` | `{ user_id, past_posts[] }` |
| `GET` | `/voice-profiles?user_id=` | Profiles for a user |
| `GET` | `/voice-profiles/{id}` | One profile |
| `PATCH` | `/voice-profiles/{id}` | Replace `past_posts[]` |

Legacy root endpoints `/` and `/health` remain for compatibility; the frontend uses `/api/v1`.

---

## Testing

```bash
uv run ruff check app tests
uv run pytest
```

Tests use an in-memory SQLite database and the offline providers, so they need no network or API key. Coverage includes the upload → generate → history flow, voice profiles, image validation, the originality gate and voice matching.

Frontend checks:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

---

## Docker

```bash
cp .env.example .env        # optional
docker compose up --build
```

- `web` → <http://localhost:3000> (Next standalone image)
- `api` → <http://localhost:8000> (uv-managed image)
- SQLite persists in the `riff-data` volume at `/data/riff.db`

The frontend build receives `API_PROXY_TARGET=http://api:8000` as a build arg because Next resolves rewrites at build time.

---

## Notes and compatibility

- Existing `riff.db` files keep working: table and column names are unchanged from the original schema.
- Alembic remains the source of truth for schema changes; `init_db()` only bootstraps an empty SQLite database for local development.
- The pipeline is two sequential provider calls. No orchestration framework is needed; `groq.AsyncGroq` is used directly.
- Voice matching is lexical (content-word similarity + recency tie-break) rather than embedding-based, keeping the service dependency-light. It can be swapped behind `select_voice_examples` later.

---

## Design principle

> Ideas are free. Words should be yours.

Riff is a technical safeguard against republication, not a legal guarantee. Similarity scores are a signal; a human still decides what gets published.
