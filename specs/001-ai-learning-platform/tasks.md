---
description: "Task list for AI-Powered Learning Platform"
---

# Tasks: AI-Powered Learning Platform

**Input**: Design documents from `/specs/001-ai-learning-platform/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec — no test tasks included (per constitution: testing is optional).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All tasks include exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js project and install all dependencies

- [x] T001 Initialize Next.js 15 project with TypeScript, App Router, and Tailwind CSS at repository root (`npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint`)
- [x] T002 Install runtime dependencies: `npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres @ai-sdk/anthropic ai next-themes react-markdown remark-gfm zod`
- [x] T003 [P] Install dev dependencies: `npm install -D drizzle-kit @playwright/test`
- [x] T004 [P] Create `.env.local.example` at project root documenting all required environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `ANTHROPIC_API_KEY`)
- [x] T005 [P] Create `drizzle.config.ts` at project root pointing to `src/lib/db/schema.ts`, outputting to `drizzle/migrations/`, using `DATABASE_URL_UNPOOLED` for migrations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on — DB schema, Supabase clients,
session middleware, root layout, and auth pages (login required for all features per plan.md decision).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Create Drizzle schema at `src/lib/db/schema.ts` — define `profiles`, `lesson_plans`, and `chat_messages` tables per `data-model.md` (note: `profiles.id` FK to `auth.users` must be a raw SQL constraint, not a Drizzle reference — add a comment pointing to T007)
- [x] T007 Create initial SQL migration file at `drizzle/migrations/0000_initial.sql` with: `profiles` table (id, display_name, avatar_url, theme_preference, created_at), `lesson_plans` table (id, user_id FK → profiles.id CASCADE, title, content JSONB, created_at, updated_at), `chat_messages` table (id, lesson_plan_id FK → lesson_plans.id CASCADE, role CHECK, content, created_at), two indexes from `data-model.md`, and the `handle_new_user` trigger function that auto-creates a profile row on `auth.users` insert
- [x] T008 Create Drizzle client at `src/lib/db/index.ts` — instantiate `drizzle()` with a `postgres(DATABASE_URL, { prepare: false })` connection (transaction pooler; `prepare: false` required for PgBouncer)
- [x] T009 Create Supabase browser client utility at `src/lib/supabase/client.ts` — export `createClient()` wrapping `createBrowserClient` from `@supabase/ssr`
- [x] T010 [P] Create Supabase server client utility at `src/lib/supabase/server.ts` — export `createClient()` wrapping `createServerClient` from `@supabase/ssr` with `next/headers` cookie adapter (wrap `set`/`remove` in try/catch)
- [x] T011 [P] Create Supabase middleware helper at `src/lib/supabase/middleware.ts` — export `updateSession(request)` using `createServerClient` with `NextRequest`/`NextResponse` cookie adapter; call `supabase.auth.getUser()` (not `getSession()`) to refresh session; return the supabase response object
- [x] T012 Create `middleware.ts` at project root — call `updateSession()` from T011; redirect unauthenticated users to `/login` for paths matching `/(protected)/**`; configure `matcher` to exclude `_next/static`, `_next/image`, `favicon.ico`
- [x] T013 Create root layout at `src/app/layout.tsx` — wrap children with `ThemeProvider` from `next-themes` (`attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`); set base HTML/body structure
- [x] T014 [P] Create login page at `src/app/(auth)/login/page.tsx` — email + password form; on submit call Supabase `signInWithPassword`; redirect to `/` on success; link to `/register`
- [x] T015 [P] Create register page at `src/app/(auth)/register/page.tsx` — email + password form; on submit call Supabase `signUp`; redirect to `/` on success; link to `/login`
- [x] T016 Create auth callback route at `src/app/auth/callback/route.ts` — exchange code for session via `supabase.auth.exchangeCodeForSession(code)` from URL params; redirect to `/`

**Checkpoint**: Foundation ready — all three user stories can now begin.

---

## Phase 3: User Story 1 - Generate a Lesson Plan via Chat (Priority: P1) 🎯 MVP

**Goal**: User types a learning request in the right chat panel; AI generates a structured
lesson plan that appears in the left docs panel, navigable by a two-level sidebar.

**Independent Test**: Log in → type "teach me Git basics" in the chat → verify a structured
lesson plan with sections/subsections appears in the left panel with a clickable sidebar.

### Implementation for User Story 1

- [x] T017 Create AI provider setup at `src/lib/ai/index.ts` — export `anthropic` instance from `@ai-sdk/anthropic`; export a `SYSTEM_PROMPT` string instructing the model to generate structured lesson plans in the `LessonPlanContent` JSON schema (sections array → subsections array → body as Markdown); export the Zod schema for `LessonPlanContent`
- [x] T018 Create `POST /api/chat` route handler at `src/app/api/chat/route.ts` — authenticate user via `createClient()` from `src/lib/supabase/server.ts`; accept `{ messages, lessonPlanId }` body; use `createDataStream` + `streamText` (model: `anthropic('claude-sonnet-4-6')`) to stream the conversational reply; use `streamObject` with the `LessonPlanContent` Zod schema to generate/update the lesson plan JSON; on stream finish, upsert the lesson plan row in `lesson_plans` and append both messages to `chat_messages` via Drizzle; write the updated lesson plan content and ID as a data annotation via `dataStream.writeData({ type: 'lesson-plan-update', lessonPlanId, title, content })`; return `toDataStreamResponse()`
- [x] T019 Create protected layout at `src/app/(protected)/layout.tsx` — server component; call `supabase.auth.getUser()`; if no user, redirect to `/login`; render children
- [x] T020 Create main page at `src/app/(protected)/page.tsx` — client component; use `useChat({ api: '/api/chat', body: { lessonPlanId } })` and track `data` array for lesson plan updates; render `<DocsPanel>` on the left and `<ChatPanel>` on the right in a split-view flex layout
- [x] T021 [P] [US1] Create `DocsSidebar` component at `src/components/docs-panel/docs-sidebar.tsx` — accept `sections` array; render a two-level nav (section title → subsection titles as links); clicking a subsection scrolls to its anchor in the content area
- [x] T022 [P] [US1] Create `DocsContent` component at `src/components/docs-panel/docs-content.tsx` — accept `sections` array; render each subsection body using `ReactMarkdown` with `remarkGfm`; each subsection has an `id` anchor matching the sidebar links
- [x] T023 [US1] Create `DocsPanel` component at `src/components/docs-panel/docs-panel.tsx` — accept `lessonPlan` (nullable); if null, show an empty-state prompt ("Ask the chatbot to create a lesson plan"); otherwise render `<DocsSidebar>` and `<DocsContent>` side by side within the panel
- [x] T024 [P] [US1] Create `ChatMessages` component at `src/components/chat-panel/chat-messages.tsx` — accept `messages` array from `useChat`; render user and assistant messages with distinct styles; auto-scroll to the latest message
- [x] T025 [P] [US1] Create `ChatInput` component at `src/components/chat-panel/chat-input.tsx` — accept `input`, `handleInputChange`, `handleSubmit`, `isLoading` from `useChat`; render a textarea + submit button; disable submit while loading
- [x] T026 [US1] Create `ChatPanel` component at `src/components/chat-panel/chat-panel.tsx` — compose `<ChatMessages>` and `<ChatInput>`; accept and pass down all `useChat` props

**Checkpoint**: User Story 1 is fully functional and independently testable.
Log in → chat → see structured lesson plan in docs panel.

---

## Phase 4: User Story 2 - Persist and Revisit Lesson Plans (Priority: P2)

**Goal**: Logged-in users can see all their saved lesson plans, switch between them, and
find them intact after logging out and back in from a different device.

**Independent Test**: Generate two lesson plans, log out, log in from another browser →
both plans are listed; clicking each loads the full content correctly.

### Implementation for User Story 2

- [x] T027 Create `GET /api/lesson-plans` route at `src/app/api/lesson-plans/route.ts` — authenticate user; query `lesson_plans` for `user_id = user.id` ordered by `updated_at DESC`; return `{ lessonPlans: [{ id, title, createdAt, updatedAt }] }` (no content field)
- [x] T028 [P] [US2] Create `GET /api/lesson-plans/[id]` route at `src/app/api/lesson-plans/[id]/route.ts` — authenticate user; query `lesson_plans` by id where `user_id = user.id` (404 if not found or wrong owner); query `chat_messages` for that plan ordered by `created_at ASC`; return `{ lessonPlan, chatMessages }`
- [x] T029 [P] [US2] Create `PATCH /api/lesson-plans/[id]` route (same file as T028) — authenticate user; accept `{ title }`; update title and `updated_at` in DB; return updated plan metadata
- [x] T030 [P] [US2] Create `DELETE /api/lesson-plans/[id]` route (same file as T028) — authenticate user; delete plan (cascades to chat_messages); return `204`
- [x] T031 [US2] Create `LessonPlanList` component at `src/components/lesson-plan-list.tsx` — accept `plans` array and `activePlanId`; render a scrollable list of plan titles; clicking a plan calls `onSelect(id)`; show active plan highlighted; include a "New lesson plan" button that calls `onNew()`
- [x] T032 [US2] Update main page `src/app/(protected)/page.tsx` — on mount, fetch `GET /api/lesson-plans` to populate the plan list; when a plan is selected, fetch `GET /api/lesson-plans/[id]` to load its content and chat history into `useChat({ initialMessages })` and the docs panel; render `<LessonPlanList>` in the left sidebar above the docs content; pass `lessonPlanId` in `useChat` body so the chat route updates the correct plan

**Checkpoint**: User Stories 1 AND 2 both work independently.
All plans persist across sessions; switching between plans loads the correct content.

---

## Phase 5: User Story 3 - Theme Toggle and Navbar Identity (Priority: P3)

**Goal**: Navbar shows the logged-in user's name/email/avatar; theme toggle switches
the entire interface between dark and light instantly.

**Independent Test**: Log in → see profile info in navbar → toggle theme twice → confirm
both themes apply to the full interface without a page reload.

### Implementation for User Story 3

- [x] T033 Create `ThemeToggle` component at `src/components/theme-toggle.tsx` — use `useTheme()` from `next-themes`; render a button that calls `setTheme(theme === 'dark' ? 'light' : 'dark')`; show a sun or moon icon (use inline SVG or a single Unicode character)
- [x] T034 Create `Navbar` component at `src/components/navbar.tsx` — server component; call `supabase.auth.getUser()` and fetch the matching `profiles` row via Drizzle; render app name/logo on the left; render `<ThemeToggle>` and user avatar + display name (or email fallback) on the right; show a sign-out button that calls `supabase.auth.signOut()`
- [x] T035 [US3] Integrate `<Navbar>` into the protected layout at `src/app/(protected)/layout.tsx` — add `<Navbar>` above the main content area; ensure the split-view takes remaining height

**Checkpoint**: All three user stories are independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final wiring, styling consistency, and user-facing error states.

- [x] T036 [P] Add `globals.css` Tailwind base styles and CSS variables for light/dark theme colors (background, foreground, muted, border) consistent with a clean docs aesthetic
- [x] T037 [P] Add loading states — show a skeleton or spinner in `<DocsPanel>` while AI is streaming; disable `<ChatInput>` submit button and show "Generating…" text during stream
- [x] T038 Add error boundaries — if `POST /api/chat` returns a non-OK response, display the error message in the chat panel instead of crashing
- [x] T039 Run quickstart.md validation — follow the 7 steps in `specs/001-ai-learning-platform/quickstart.md` end-to-end and confirm the happy path works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on US2 or US3
- **US2 (Phase 4)**: Depends on Phase 2; benefits from US1 (reuses components) but is independently implementable
- **US3 (Phase 5)**: Depends on Phase 2 (Supabase client, layout shell) — no dependency on US1 or US2
- **Polish (Phase N)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependency on US2 or US3
- **US2 (P2)**: Can start after Foundational — shares components with US1 but testable independently
- **US3 (P3)**: Can start after Foundational (T013 root layout) — fully independent of US1/US2

### Within Each User Story

- Models/DB queries: T006–T008 (Foundational) — must precede route handlers
- Supabase clients: T009–T011 (Foundational) — must precede auth pages and route handlers
- Auth pages: T014–T016 (Foundational) — must precede protected pages
- Route handlers before UI components that call them

### Parallel Opportunities

- T003, T004, T005 can run in parallel with T002 in Phase 1
- T010, T011 can run in parallel in Phase 2
- T014, T015 can run in parallel in Phase 2
- T021, T022 can run in parallel in Phase 3
- T024, T025 can run in parallel in Phase 3
- T028, T029, T030 can run in parallel in Phase 4 (same file, different handlers)

---

## Parallel Example: US1 Components

```bash
# These components have no inter-dependencies — launch simultaneously:
Task: "Create DocsSidebar at src/components/docs-panel/docs-sidebar.tsx"          # T021
Task: "Create DocsContent at src/components/docs-panel/docs-content.tsx"           # T022
Task: "Create ChatMessages at src/components/chat-panel/chat-messages.tsx"         # T024
Task: "Create ChatInput at src/components/chat-panel/chat-input.tsx"               # T025
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Log in → generate a lesson plan → verify docs panel updates
5. Demo the split-view chat → docs flow

### Incremental Delivery

1. Setup + Foundational → project runs, auth works
2. Add US1 → generate lesson plans → **MVP!**
3. Add US2 → plans persist, multi-plan switching works
4. Add US3 → theme toggle + full navbar → **Feature complete**
5. Polish phase → loading states, error handling

---

## Notes

- `[P]` tasks have no dependency on incomplete sibling tasks and can run in parallel
- `[Story]` label maps each task to a specific user story for traceability
- `prepare: false` on the Drizzle postgres client (T008) is mandatory for Supabase's PgBouncer transaction pooler
- The `auth.users` FK on `profiles` (T007) must be written as raw SQL — Drizzle cannot reference the `auth` schema
- No test tasks generated — testing is optional per constitution and not requested in spec
- Commit after each task or logical group; stop at any checkpoint to validate independently
