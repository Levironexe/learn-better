# Implementation Plan: AI-Powered Learning Platform

**Branch**: `001-ai-learning-platform` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-learning-platform/spec.md`

## Summary

A recreational split-view web app where an LLM-powered chatbot generates and revises
structured lesson plans displayed in a docs-style left panel. Users log in to persist
multiple lesson plans across sessions. Built with Next.js 15 (App Router), Supabase
(auth + PostgreSQL), Drizzle ORM, Vercel AI SDK (Anthropic Claude), and Playwright for
optional e2e tests.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 15, `@supabase/ssr` ^0.5, `ai` v4, `@ai-sdk/anthropic`,
`drizzle-orm`, `next-themes`, `react-markdown`, `remark-gfm`, `@playwright/test`
**Storage**: Supabase PostgreSQL — `profiles`, `lesson_plans`, `chat_messages` tables
**Testing**: Playwright (e2e only, optional per constitution)
**Target Platform**: Modern web browser (Chrome, Firefox, Safari)
**Project Type**: Web application (fullstack, single Next.js project)
**Performance Goals**: Lesson plan first token within 3s; theme toggle instant (no reload)
**Constraints**: Recreational project — no production hardening required
**Scale/Scope**: Single user to small number of users; no concurrent-user scaling needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | Single Next.js project, no extra layers. Chat-only editing (no inline editor). Login required (no anonymous mode). Next-themes for theme — no custom implementation. |
| II. It Must Work | ✅ PASS | Standard web app. All features verifiable in a browser. |
| III. No Production Concerns | ✅ JUSTIFIED EXCEPTION | Auth and DB persistence are **explicitly required by the spec** (User Story P2). No rate limiting, security hardening, compliance, scal/ing, or observability added beyond the minimum needed to deliver the spec. |

**Post-design re-check**: No new violations introduced by the design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-learning-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx          # Auth guard — redirects to /login if no session
│   │   └── page.tsx            # Main split-view layout (docs panel + chat panel)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # Supabase OAuth/magic-link callback handler
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts        # POST — streaming AI endpoint
│   │   └── lesson-plans/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/
│   │           └── route.ts    # GET, PATCH, DELETE
│   ├── layout.tsx              # Root layout — ThemeProvider, fonts
│   └── globals.css
├── components/
│   ├── navbar.tsx              # Logo, user info, theme toggle
│   ├── theme-toggle.tsx        # Dark/light toggle button
│   ├── docs-panel/
│   │   ├── docs-panel.tsx      # Left panel wrapper
│   │   ├── docs-sidebar.tsx    # 2-level nav (sections + subsections)
│   │   └── docs-content.tsx    # Markdown renderer for section bodies
│   └── chat-panel/
│       ├── chat-panel.tsx      # Right panel wrapper
│       ├── chat-messages.tsx   # Message list
│       └── chat-input.tsx      # Input form
├── lib/
│   ├── db/
│   │   ├── index.ts            # Drizzle client (uses DATABASE_URL)
│   │   └── schema.ts           # Table definitions (profiles, lesson_plans, chat_messages)
│   ├── supabase/
│   │   ├── client.ts           # createBrowserClient wrapper
│   │   ├── server.ts           # createServerClient wrapper (next/headers)
│   │   └── middleware.ts       # updateSession helper
│   └── ai/
│       └── index.ts            # Anthropic provider setup, system prompt
└── middleware.ts               # Session refresh + route protection (at project root)

tests/
└── e2e/
    ├── auth.spec.ts
    ├── lesson-plan.spec.ts
    └── theme.spec.ts

drizzle/
└── migrations/                 # Generated SQL migration files

drizzle.config.ts               # Points to DATABASE_URL_UNPOOLED for migrations
playwright.config.ts
next.config.ts
tailwind.config.ts
```

**Structure Decision**: Single Next.js project using App Router. Route groups `(auth)`
and `(protected)` separate public pages from auth-gated pages without affecting the URL.
All backend logic lives in Next.js route handlers under `app/api/` — no separate server.

## Complexity Tracking

> No constitution violations to justify — all principles pass.
