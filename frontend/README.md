# Riff web

Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui frontend for the Riff API.

## Development

```bash
npm install
npm run dev
```

The app calls `/api/v1/*` same-origin; `next.config.ts` rewrites it to the FastAPI server at `http://127.0.0.1:8000` (override with `API_PROXY_TARGET`). Start the backend from the repository root:

```bash
uv run uvicorn app.main:app --reload
```

For a deployment where the API lives on another origin, build with `NEXT_PUBLIC_API_URL=https://api.example.com`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Structure

```
src/app/            routes: studio (/), voice, history, error/loading/not-found
src/components/      shell, studio, voice, history, ui (shadcn)
src/lib/             api client, types, storage, formatting
```

See the root `README.md` for architecture, configuration and API details.
