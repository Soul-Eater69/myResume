# Open Resume Platform - High-Level and Low-Level Implementation Guide

**Version:** 1.0
**Audience:** Claude or any engineer building the system end-to-end
**Goal:** Provide a clean, implementation-ready architecture document for an open platform that stores a user's full professional knowledge, tailors resumes to job descriptions, tracks jobs, and uses GitHub repositories as an additional project signal.

---

## 1. Executive Summary

This product is **not only a resume generator**. It is a **career knowledge platform**.

The system should:
- Store the user's long-term professional knowledge in a structured profile vault.
- Accept job descriptions and track applications.
- Generate tailored resumes using verified profile data.
- Connect to GitHub and extract relevant repositories as project evidence.
- Preserve generated versions per job.
- Separate **verified facts** from **AI suggestions**.

## 2. Product Goals and Non-Goals

### 2.1 Goals
- One place for a user's full professional profile.
- Tailored resumes to specific jobs using structured profile retrieval.
- Track jobs, applications, and resume versions.
- Import GitHub repositories as project evidence.
- Keep generated content trustworthy and reviewable.

### 2.2 Non-Goals for V1
- No billing or subscription system.
- No enterprise permissions model.
- No microservices.
- No autonomous job scraping engine.
- No auto-invented facts.

## 3. Product Principles
1. Profile vault is the source of truth.
2. Verified content and suggested content must be separate.
3. Every generated resume is versioned.
4. GitHub is an input source, not an uncontrolled prompt dump.
5. Use structured intermediate data.
6. Keep the architecture modular, but start as one deployable app.

## 4. Core User Flows
- Initial profile setup (upload/build profile, optional GitHub ingestion).
- Add job (paste JD -> store -> extract signals -> rank relevant items).
- Generate resume (select job -> compose -> generate -> validate -> preview -> save).
- Track application (stage, linked resume version, notes).
- Import from GitHub (connect -> sync -> summarize -> approve).

## 5. System Scope
Auth; profile vault; resume parsing; job management; resume composition and generation; GitHub integration; rendering/export; application tracker; AI orchestration and validation.

Stack: Next.js + TypeScript, Postgres + Prisma, Redis + BullMQ, Tailwind/shadcn-style UI, LLM provider abstraction with JSON schema outputs.

Deployment: modular monolith (web + worker, postgres, redis, object storage).

## 6. High-Level Architecture
```
[Web UI] -> [API Layer / BFF]
  -> Auth | Profile | Job | Resume | GitHub | Application | AI
  -> PostgreSQL | Object Storage | Redis/BullMQ
       -> Worker (parse, sync, summarize, export, score)
```

## 7. Frontend Architecture
Main routes: /dashboard, /profile (+tabs), /jobs (+[id]), /resume-builder/[jobId], /github, /applications, /settings.

Shell: left sidebar, top bar, content area, optional right preview panel.

State: server -> TanStack Query; forms -> React Hook Form; UI local -> React/Zustand; validation -> shared Zod.

## 8. Backend Module Design
Modules: Auth, Profile, Job, Resume, GitHub, Application, AI Orchestration. Routes map to section 17 below. AI internal functions: `extractJobSignals`, `parseResume`, `rankProfileAgainstJob`, `summarizeRepo`, `composeResumeDraft`, `validateGeneratedResume`.

## 9. Database Design
See prisma/schema.prisma in this repo for the authoritative schema. Tables: users, profiles, experiences, experience_bullets, projects, project_bullets, skills, education, certifications, profile_links, uploaded_files, jobs, job_signals, github_connections, github_repos, repo_summaries, resumes, resume_versions, applications, ai_generation_logs.

## 10. Shared Schemas
Resume JSON: `{ basics, summary, skills[], experience[], projects[], education[] }`.
Job signals JSON: `{ keywords[], requiredSkills[], preferredSkills[], domainTags[], seniority, summary }`.
Match result JSON: `{ jobId, experienceMatches[], projectMatches[], repoMatches[], skillMatches[] }`.

See `src/schemas/` for the canonical Zod definitions.

## 11. Resume Generation Pipeline
Job input -> extract signals -> rank profile items -> select top -> compose prompt -> structured generation -> validate -> render -> save version.

## 12. Prompt Architecture
Static system prompt forbids fabrication, requires JSON schema.
Dynamic inputs include job title/summary, selected experiences/projects/repos, skills, page constraint, template rules.
Modes: Verified (default) vs Suggestion (labeled, never silently merged).

## 13. GitHub Integration
Use cases: import, summarize, tag, match. Fetch metadata + README. Summarize into resume-ready drafts that remain `review_needed` until the user confirms.

## 14. Resume Parsing
Inputs: PDF, DOCX, text. Extract basics/summary/experience/projects/education/certifications/links/skills. Always editable.

## 15. Matching and Ranking
V1 hybrid score: `0.45 * skill + 0.30 * keyword + 0.15 * domain + 0.10 * recency`.
Inputs: normalized text, stacks, tags, required/preferred skills. Future: embeddings + LTR.

## 16. Rendering
Internal: structured resume JSON -> React template -> preview. PDF via worker (puppeteer/print) -> object storage. DOCX deferred.

## 17. API Design Details
REST endpoints under /api/auth, /api/profile (+experience/projects/skills/education/certifications/links/resume-upload), /api/jobs (+extract, matches), /api/resumes (generate/validate/[id]/preview/export-pdf), /api/github (connect/repos/sync/[id]/summarize/import-to-projects), /api/applications. See source for request/response shapes.

## 18. Worker and Queue Design
Queues: resume-parse, github-sync, repo-summary, pdf-export, job-signal. States: pending/processing/completed/failed. Retries with exponential backoff + dead-letter.

## 19. Validation and Trust Layer
Hard rules: reject unknown company/project/repo references, inserted dates, unsupported skills, fabricated metrics.
Soft rules: warn on repetition, generic summary, weak keyword coverage, page density.
Store suggestions separately (`suggestedProjectIdeas`, `suggestedBulletImprovements`, `missingEvidence`).

## 20. Security and Privacy
Encrypt tokens at rest, hash passwords (bcrypt/argon2), signed session cookies, owner checks on every record. Minimize raw LLM prompt logging in production.

## 21. Observability
Log request id, user id, endpoint, job id, model, duration, error.
Track extraction/generation/export latency, queue failure rate, parser accuracy.
Admin debug views: raw parse, normalized JSON, signals, match scores, generation context, raw LLM output, validation warnings.

## 22. Repository Structure
See actual tree in this repo: `src/app`, `src/modules`, `src/schemas`, `src/components`, `src/lib`, `src/worker`, `prisma`, `docs`.

## 23. Implementation Plan by Phase
Phase 1: auth, profile, upload+parse, jobs, signals, matching, generation, preview, versioning, applications.
Phase 2: GitHub connect + sync + summarization + import.
Phase 3: PDF export, templates, stronger validation, suggestion mode UI.
Phase 4: embeddings ranking, scorecards, cover letters, interview prep.

## 24. Testing Strategy
Unit: signals normalization, ranking, validation, permissions.
Integration: create job -> extract -> match -> generate -> save; upload -> parse; github sync -> summarize -> import.
E2E: onboarding, add JD + generate, regenerate, import repo, move application.
Golden fixtures for resumes/JDs/READMEs.

## 25. Risks and Mitigations
Hallucinated content -> grounding + validation + verified/suggested split.
Parser noise -> editable review UI, confidence indicators.
Repo overclaims -> review step, confidence tagging.
Prompt bloat -> pre-rank + select top-N.
Slow generation -> async workers + job status UI.

## 26. Architecture Review Checklist
Review domain separation, thin routes + service-owned logic, async for latency, shared schemas at boundaries, ownership enforcement, structured resume storage, grounded prompts, validation layer, verified-vs-suggested UX, reliability paths.

## 27. Concrete Build Order
1. shared + db schema
2. auth/session
3. profile CRUD
4. resume upload + parser stub
5. jobs CRUD
6. job signal extraction
7. ranking engine
8. generation endpoint (static template)
9. preview UI
10. versions + job link
11. applications tracker
12. GitHub connection + sync
13. summarization + import
14. PDF export worker
15. validation + debug views

## 28. Final Recommendation
Build as a career knowledge workspace with resume generation as one capability. Prefer modular monolith, structured vault + signals, deterministic pre-ranking, verified/suggested separation, summarized GitHub evidence, versioned outputs per job.

## 29. Optional Post-MVP Enhancements
Browser extension, LinkedIn sync, interview prep, cover letters, outreach drafts, template marketplace, analytics.

## 30. Minimal Success Criteria for V1
User can: sign up, build profile, paste JD, see matches, generate tailored resume without fabrication, save version, track application, optionally import a GitHub repo.
