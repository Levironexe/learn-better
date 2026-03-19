# Research: AI-Powered Learning Platform

**Feature**: 001-ai-learning-platform
**Date**: 2026-03-18
**Sources**: Supabase docs, Vercel AI SDK docs, Drizzle ORM docs (via agent knowledge base, August 2025)

---

## Decision 1: Fullstack Framework

**Decision**: Next.js 15 with App Router

**Rationale**: Specified by user. App Router co-locates server and client code,
supports streaming via React Suspense, and enables route handlers for API endpoints.
Single project covers both frontend UI and backend API — no separate server needed.

**Alternatives considered**: None (user-specified)

---

## Decision 2: Database and Auth

**Decision**: Supabase (PostgreSQL + Supabase Auth)

**Rationale**: Specified by user. Supabase Auth handles email/password registration and
session management. Its `@supabase/ssr` package integrates cleanly with Next.js App Router
via `createBrowserClient` (client components) and `createServerClient` (server components,
middleware, route handlers). Supabase manages user sessions via cookies with automatic
JWT refresh in middleware.

**Key integration notes**:
- Packages: `@supabase/supabase-js` ^2.45, `@supabase/ssr` ^0.5
- Use `getUser()` server-side — never `getSession()`, which skips JWT re-validation
- Middleware at `middleware.ts` refreshes session on every request via `createServerClient`
- Utility files at `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` centralize
  the cookie adapter boilerplate
- Two-layer route protection: middleware redirects + server component re-check

**Alternatives considered**: None (user-specified)

---

## Decision 3: ORM

**Decision**: Drizzle ORM + drizzle-kit

**Rationale**: Specified by user. Drizzle provides type-safe schema definitions and query
building. drizzle-kit handles migrations.

**Key integration notes**:
- Two database connection strings required:
  - `DATABASE_URL` — Supabase transaction pooler (port 6543) for runtime queries in
    serverless Next.js route handlers
  - `DATABASE_URL_UNPOOLED` — Supabase direct connection (port 5432) for drizzle-kit
    migrations only (PgBouncer transaction mode blocks migration statements)
- `drizzle.config.ts` uses `dialect: 'postgresql'` and `dbCredentials.url` pointing to
  `DATABASE_URL_UNPOOLED`
- Migration workflow: `drizzle-kit generate` → `drizzle-kit migrate`
- `drizzle-kit push` is acceptable for this recreational project during development
- Add `prepare: false` to the `postgres()` runtime client to avoid prepared-statement
  errors with PgBouncer transaction pooler
- The `auth.users` FK on `profiles` cannot be modeled in Drizzle (Supabase manages the
  `auth` schema). Write the constraint manually in a raw SQL migration instead.

**Alternatives considered**: None (user-specified)

---

## Decision 4: AI / LLM Integration

**Decision**: Vercel AI SDK v4 (`ai` + `@ai-sdk/anthropic`)

**Rationale**: Specified by user. The AI SDK provides first-class streaming primitives for
Next.js. `streamText` in a route handler + `useChat` hook on the client handles the chat
panel. For the docs panel updates (structured lesson plan JSON), `streamObject` + `useObject`
provides typed streaming of the lesson plan content alongside the chat stream.

**Key integration notes**:
- Server: `streamText` for conversational responses, `streamObject` (with Zod schema) for
  lesson plan content generation
- Client: `useChat` (chat panel messages), `useObject` (docs panel live updates)
- Model: `anthropic('claude-sonnet-4-6')` from `@ai-sdk/anthropic`
- API endpoint: `POST /api/chat` — receives messages + current lesson plan context,
  returns streamed response + updated lesson plan JSON
- `toDataStreamResponse()` is the correct return type for `useChat` compatibility

**Alternatives considered**: OpenAI (rejected — Anthropic Claude is more capable for
structured educational content generation per user context)

---

## Decision 5: Testing

**Decision**: Playwright for end-to-end testing

**Rationale**: Specified by user. Playwright tests run against the full Next.js app (browser
level), covering the split-view layout, auth flows, lesson plan generation, and theme toggle.
Tests are OPTIONAL per the constitution — include only the flows explicitly requested in spec.

**Key integration notes**:
- Package: `@playwright/test`
- Config: `playwright.config.ts` at project root
- Tests at `tests/e2e/`
- Run `npx playwright install` once to download browser binaries

**Alternatives considered**: None (user-specified)

---

## Decision 6: Theme System

**Decision**: `next-themes` + Tailwind CSS dark mode (class strategy)

**Rationale**: `next-themes` wraps the app with a theme provider and handles system
preference detection, localStorage persistence, and zero-flash SSR. Tailwind's `dark:`
variant with `darkMode: 'class'` applies theme-specific styles. This is the simplest
possible approach for two-theme support.

**Packages**: `next-themes`

---

## Decision 7: Markdown Rendering (Docs Panel)

**Decision**: `react-markdown` + `remark-gfm`

**Rationale**: Lesson plan content (subsection bodies) is Markdown. `react-markdown` renders
it safely in the browser without `dangerouslySetInnerHTML`. `remark-gfm` adds tables, task
lists, and other GitHub-flavored Markdown extensions useful for educational content.

---

## Resolution of Spec Clarifications

### FR-011 — Anonymous Mode
**Decision**: Login required before generating any lesson plan.

**Rationale**: Per constitution Principle I (Simplicity First), supporting anonymous/guest
mode requires temporary session storage and later merging of plans on login. This complexity
is not justified for a recreational project. Redirecting unauthenticated users to the login
page is the simplest correct behavior.

### FR-012 — Document Editing Mode
**Decision**: Chat-only modification — the left panel is read-only; all changes are made
through the chat interface.

**Rationale**: Per constitution Principle I (Simplicity First), an inline document editor
(rich text or markdown editing) is a significant scope addition. The spec's primary value
is AI-driven content generation and revision via chat. The simpler path fully satisfies the
user's described need.
