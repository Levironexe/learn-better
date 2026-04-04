# Erudex

An AI-powered learning platform that generates structured, pedagogically ordered lesson plans from natural language requests. Users chat with an AI assistant to create, revise, and navigate lesson content — all persisted to their account across devices.

---

## Overview

Erudex presents a split-view interface: a **docs panel** on the left displays structured lesson plans with a two-level hierarchy (sections → subsections), and a **chat panel** on the right lets users request new lessons or revise existing ones. The AI proposes a plan, the user accepts or declines, and confirmed plans are saved to the database linked to the user's account.

Key capabilities:

- Generate lesson plans on any topic via chat
- Optionally enrich content with live web search (Brave Search via MCP)
- Review AI proposals before committing them to the database
- Edit section content inline in the docs panel
- Switch between saved lesson plans; all chat history is preserved per plan
- Dark / light theme toggle

> Built with [Spec Kit](https://github.com/spec-kit/specify) — a specification-driven AI development workflow. All feature specs, plans, and task breakdowns live in the `specs/` directory.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.7 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19.2.3, Tailwind CSS v4 (CSS-first) |
| AI | Vercel AI SDK v6, `@ai-sdk/anthropic` v3, Claude Haiku |
| Web Search | `@modelcontextprotocol/sdk` v1.27.1 + Brave Search MCP |
| ORM | Drizzle ORM 0.45.1 |
| Database | PostgreSQL via Supabase (pooled runtime connection) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Markdown | `react-markdown` 10.1.0, `remark-gfm` 4.0.1 |
| Icons | `lucide-react` |
| Validation | Zod v4 |
| Testing | Vitest 3, Playwright |

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with email/password auth enabled
- An [Anthropic API key](https://console.anthropic.com)
- *(Optional)* A [Brave Search API key](https://brave.com/search/api/) for web-enriched lesson generation

---

## Installation

```bash
# Clone the repository
git clone https://github.com/Levironexe/learn-better.git
cd learn-better

# Install dependencies (npm or pnpm both work)
npm install
# or
pnpm install
```

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) key |
| `DATABASE_URL` | ✅ | Pooled connection string (port 6543) — used at runtime |
| `DATABASE_URL_UNPOOLED` | ✅ | Direct connection string (port 5432) — used by Drizzle migrations only |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key for Claude |
| `BRAVE_API_KEY` | ➖ | Brave Search API key — enables live web search during lesson creation |

Both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are available from your Supabase dashboard under **Project Settings → Connect**.

---

## Database Setup

Run migrations against your Supabase database using the direct (unpooled) connection:

```bash
npx drizzle-kit migrate
# or
pnpm drizzle-kit migrate
```

To inspect or generate new migrations after schema changes:

```bash
# Generate a new migration from schema changes
npx drizzle-kit generate

# Open Drizzle Studio to browse your data
npx drizzle-kit studio
```

---

## Running the Project

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000). Unauthenticated users are automatically redirected to `/login`.

---

## Running Tests

```bash
# Run all unit and integration tests
npm test

# Run linting
npm run lint

# Run both (matches CI)
npm test && npm run lint
```

Test files are located in `tests/` and organised into `unit/`, `integration/`, `api/`, and `e2e/` subdirectories.

---

## Project Structure

```
erudex/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Public routes: /login, /register
│   │   ├── (protected)/             # Main app shell (auth-gated)
│   │   │   └── page.tsx             # Split-view home page
│   │   ├── api/                     # Next.js API route handlers
│   │   │   ├── chat/                # POST /api/chat — AI streaming endpoint
│   │   │   └── lesson-plans/        # CRUD + proposal endpoints
│   │   ├── auth/                    # Supabase auth callback handler
│   │   ├── lessons/[id]/            # Standalone lesson viewer
│   │   └── layout.tsx               # Root layout with ThemeProvider
│   ├── components/
│   │   ├── chat-panel/              # Chat UI and message rendering
│   │   ├── docs-panel/              # Lesson content viewer + section editor
│   │   ├── ui/                      # Shared primitives (ResizablePanels, etc.)
│   │   ├── navbar.tsx
│   │   ├── lesson-plan-list.tsx
│   │   └── theme-toggle.tsx
│   ├── hooks/
│   │   └── use-resizable-panels.ts  # Panel width persistence via localStorage
│   ├── lib/
│   │   ├── ai/                      # Anthropic client, prompts, Zod schemas, MCP setup
│   │   ├── db/                      # Drizzle schema, query helpers, validation
│   │   ├── editor/                  # Section content editor utilities
│   │   ├── supabase/                # Server + client Supabase factories
│   │   └── utils/                   # Slugify and other helpers
│   └── types/
│       └── ai.ts                    # Shared AI message / proposal types
├── tests/
│   ├── unit/                        # Pure function and hook tests
│   ├── integration/                 # Component-level integration tests
│   ├── api/                         # API route contract tests
│   └── e2e/                         # Playwright end-to-end tests
├── drizzle/
│   └── migrations/                  # SQL migration files managed by drizzle-kit
├── specs/                           # Feature specification documents
├── drizzle.config.ts
├── middleware.ts                    # Auth guard — redirects unauthenticated users to /login
├── next.config.ts
└── vitest.config.ts
```

---

## API Endpoints

All endpoints require an authenticated Supabase session (cookie-based). Unauthenticated requests return `401 Unauthorized`.

### Chat

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Streaming AI chat. Accepts `{ messages, lessonPlanId? }`. Detects intent, optionally runs Brave web search, generates a lesson plan proposal, and streams a conversational reply. |

### Lesson Plans

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/lesson-plans` | List all lesson plans for the authenticated user |
| `GET` | `/api/lesson-plans/:id` | Fetch a single lesson plan with sections, items, and chat history |
| `PATCH` | `/api/lesson-plans/:id` | Update the plan title |
| `DELETE` | `/api/lesson-plans/:id` | Delete a lesson plan (cascades to sections, items, and chat messages) |

### Proposal Lifecycle

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/lesson-plans/accept-proposal` | Persist an accepted AI proposal — creates or replaces the lesson plan in the database |
| `POST` | `/api/lesson-plans/decline-proposal` | Dismiss a pending proposal (no database write) |

### Sections & Items

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/lesson-plans/:id/sections` | List all sections for a plan |
| `POST` | `/api/lesson-plans/:id/sections` | Create a new section |
| `GET` | `/api/lesson-plans/:id/sections/:sectionId` | Get a single section |
| `PATCH` | `/api/lesson-plans/:id/sections/:sectionId` | Update section title or content |
| `DELETE` | `/api/lesson-plans/:id/sections/:sectionId` | Delete a section (cascades to items) |
| `GET` | `/api/lesson-plans/:id/sections/:sectionId/items` | List items in a section |
| `POST` | `/api/lesson-plans/:id/sections/:sectionId/items` | Create a new item |
| `PATCH` | `/api/lesson-plans/:id/sections/:sectionId/items/:itemId` | Update an item |
| `DELETE` | `/api/lesson-plans/:id/sections/:sectionId/items/:itemId` | Delete an item |

---

## Database Schema

| Table | Description |
|---|---|
| `profiles` | Mirrors `auth.users` 1-to-1; stores display name, avatar URL, and theme preference |
| `lesson_plans` | Titled plan owned by a user, with created/updated timestamps |
| `lesson_sections` | Ordered sections within a plan, each holding `content_markdown` and a unique slug |
| `lesson_items` | Ordered subsections within a section, each holding `body_markdown` and an anchor ID |
| `chat_messages` | Conversation history scoped to a lesson plan (role: `user` or `assistant`) |

All relationships cascade on delete — removing a lesson plan removes all its sections, items, and chat messages.

---

## Deployment

The project is configured for [Vercel](https://vercel.com). To deploy:

1. Push to your Git remote
2. Import the repository in Vercel
3. Add all required environment variables under **Project Settings → Environment Variables**
4. Deploy — Vercel will run `npm run build` automatically

---

## Contributing

1. **Fork** the repository and create a feature branch from `main`
2. **Read the relevant spec** in `specs/` before starting — features are designed spec-first using [Spec Kit](https://github.com/spec-kit/specify)
3. **Write tests** — new API routes need tests in `tests/api/`, new utilities in `tests/unit/`
4. **Pass CI checks** before opening a PR:
   ```bash
   npm test && npm run lint
   ```
5. **Keep PRs focused** — one feature or fix per pull request
6. **Open a pull request** with a clear description of the change and a reference to the relevant spec

### Code Style Guidelines

- TypeScript strict mode is enabled — avoid `any`
- Use Drizzle's query builder for all database access; raw SQL belongs in migration files only
- AI prompts and Zod schemas live in `src/lib/ai/` — keep them co-located
- Tailwind CSS v4 CSS-first config — add custom design tokens in `src/app/globals.css`, not a JS config file
- All auth checks follow the same pattern: get Supabase user from the server client, return `401` immediately if absent

---

## License

MIT
