# Open Resume Platform

A career knowledge platform with tailored resume generation, job tracking, and GitHub-sourced project evidence. Built as a modular Next.js monolith per the architecture in [docs/resume-platform-guide.md](docs/resume-platform-guide.md).

## Stack

- Next.js 15 (App Router) + TypeScript
- Prisma + PostgreSQL
- Zod schemas (shared client/server)
- Tailwind CSS
- BullMQ + Redis workers
- Anthropic SDK (with rule-based fallbacks)

## Quick start

```bash
cp .env.example .env          # set DATABASE_URL, SESSION_SECRET, REDIS_URL
pnpm install                  # or npm install
pnpm db:push                  # apply Prisma schema to Postgres
pnpm dev                      # web app on http://localhost:3000
pnpm worker                   # background jobs (separate terminal)
```

## Layout

```
src/
  app/                  Next.js pages + API routes
  modules/              Domain services (auth, profile, jobs, resumes, github, applications, ai)
  schemas/              Shared Zod schemas
  components/           UI primitives and feature components
  lib/                  db, auth, logger, api helpers
  worker/               BullMQ worker processes
prisma/                 Prisma schema
docs/                   Architecture and API docs
```

## Implementation phase

Current scope covers **Phase 1 MVP** (auth, profile vault, jobs, resume generation, versioning, applications) with scaffolded **Phase 2** (GitHub ingestion) and **Phase 3** (PDF export via client print; server PDF worker stubbed).
