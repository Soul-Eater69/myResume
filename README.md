# Open Resume Platform

A career knowledge platform with tailored resume generation, job tracking, and GitHub-sourced project evidence. Built as a modular Next.js monolith per the architecture in [docs/resume-platform-guide.md](docs/resume-platform-guide.md).

## Stack

- Next.js 15 (App Router) + TypeScript
- Prisma + PostgreSQL
- Zod schemas (shared client/server)
- Tailwind CSS (enterprise design system with Inter font)
- BullMQ + Redis workers
- AI providers: **Anthropic Claude** or **OpenAI GPT** (selectable per-user from the UI, with rule-based fallback when no key is configured)

## Prerequisites

- Node.js 18.18+ (20+ recommended)
- npm 10+ (or pnpm / yarn — examples below use npm)
- PostgreSQL 14+
- Redis 6+ (only required for the background worker)

Or just **Docker** — see [Run with Docker](#run-with-docker) below.

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd myResume
npm install
```

### 2. Configure environment

Copy the example and fill in values:

```bash
cp .env.example .env
```

Required:

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Long random string used for session cookies and AES-256-GCM encryption of stored API keys / GitHub PATs |
| `REDIS_URL` | Redis URL for BullMQ (worker only) |

Optional (AI providers):

| Var | Purpose |
| --- | --- |
| `AI_PROVIDER` | Default provider — `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Claude API key + model (default `claude-sonnet-4-6`) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI API key + model (default `gpt-4o-mini`) |

> Each user can override the provider, model, and key from **Settings → AI provider** in the UI. Env keys act as a fallback when a user hasn't saved their own.

Optional (storage / integrations):

| Var | Purpose |
| --- | --- |
| `STORAGE_DIR` | Local filesystem path for resume uploads (default `./.storage`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Reserved for future OAuth flow — the MVP uses personal access tokens entered in the UI |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Provision the database

Apply the Prisma schema (creates all tables including `ai_settings`):

```bash
npx prisma db push
# or, to create a migration file
npx prisma migrate dev --name init
```

Generate the Prisma client (runs automatically on install; rerun after schema changes):

```bash
npx prisma generate
```

### 4. Start the app

```bash
npm run dev            # web app on http://localhost:3000
npm run worker         # background jobs (separate terminal, optional in dev)
```

Create an account at `/signup`, then head to **Settings** to pick a provider and save your API key.

## Run with Docker

The bundled `docker-compose.yml` defines four services:

| Service | Purpose | Always on |
| --- | --- | --- |
| `postgres` | Postgres 16 database | yes |
| `redis` | Redis 7 for BullMQ | yes |
| `web` | Next.js app (profile `app`) | opt-in |
| `worker` | BullMQ processors (profile `app`) | opt-in |

### Option A — services only (fastest dev loop)

Run Postgres + Redis in Docker, then the app locally with `npm run dev`:

```bash
cp .env.example .env
# make sure .env has:
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/open_resume
#   REDIS_URL=redis://localhost:6379

docker compose up -d postgres redis
npx prisma db push
npm run dev
```

### Option B — everything in Docker

Also builds and runs the web app + worker:

```bash
cp .env.example .env        # set SESSION_SECRET (required); add AI keys if you have them
docker compose --profile app up -d --build
docker compose exec web npx prisma db push   # one-time schema push
```

App listens on <http://localhost:3000>.

### Useful commands

```bash
docker compose logs -f web                 # follow app logs
docker compose logs -f worker              # follow worker logs
docker compose exec postgres psql -U postgres -d open_resume
docker compose --profile app down          # stop app containers
docker compose down -v                     # stop everything + delete volumes (destructive)
```

Persistent data lives in three named volumes: `postgres_data`, `redis_data`, `storage_data` (user uploads).

## Using AI providers

The platform works with **zero keys** — every AI flow has a deterministic rule-based fallback. Add keys to unlock AI bullet drafting, resume composition, and job-signal extraction.

- **Global keys** — set `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` in `.env`. All users share them.
- **Per-user keys** — from **Settings → AI provider**, pick a provider, choose a model, paste your key. Keys are AES-256-GCM encrypted with `SESSION_SECRET` and stored in `ai_settings`.
- **Model list** — Claude (Opus 4.7, Sonnet 4.6, Haiku 4.5) and GPT (4o, 4o-mini, 4.1, 4.1-mini) are offered out of the box. Edit `SUPPORTED_MODELS` in `src/modules/ai/provider.ts` to add more.

## Connecting GitHub

1. Create a **classic personal access token** with `repo` read scope at https://github.com/settings/tokens
2. Paste it on the **GitHub** page
3. Click **Sync repos** → then **Summarize** on any repo → then **Import to projects**

PATs are encrypted at rest using `SESSION_SECRET`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js in dev mode |
| `npm run build` | Production build |
| `npm start` | Start built app |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next lint |
| `npm run worker` | Run BullMQ worker (tsx) |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | Push schema to DB (no migration files) |
| `npm run db:migrate` | `prisma migrate dev` |

## Layout

```
src/
  app/                  Next.js pages + API routes
    (auth)/             login, signup
    (dashboard)/        profile, jobs, applications, github, resume-builder, settings
    api/                REST endpoints (profile, jobs, resumes, github, ai, auth)
  modules/              Domain services (auth, profile, jobs, resumes, github, applications, ai)
  schemas/              Shared Zod schemas
  components/           UI primitives (button, card, input, badge, toast, alert, icon, …)
  lib/                  db, auth, crypto, logger, api helpers
  worker/               BullMQ worker processes
prisma/                 Prisma schema
docs/                   Architecture and API docs
```

## Implementation status

- **Phase 1 MVP** — auth, profile vault, jobs, resume generation, versioning, applications
- **Phase 2** — GitHub connect / sync / summarize / import with encrypted PATs and deterministic fallback
- **Phase 3** — PDF export via client print (server PDF worker stubbed)
- **Multi-provider AI** — Anthropic Claude and OpenAI GPT with UI selector and encrypted per-user keys

## Troubleshooting

- **`prisma db push` fails with "database does not exist"** — create it first: `createdb open_resume`
- **Session cookies invalid after changing `SESSION_SECRET`** — all sessions and encrypted tokens are bound to the secret. Changing it invalidates saved GitHub PATs and stored AI keys; users must re-enter them.
- **`npm run worker` errors on Redis** — make sure `REDIS_URL` points to a running Redis. The dev web server runs fine without the worker.
- **AI flows returning generic bullets** — either no provider key is configured or the selected provider returned an error. Check **Settings** and server logs (`llm_call_failed`).
