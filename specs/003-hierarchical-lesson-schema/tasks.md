# Tasks: Hierarchical Lesson Plan Schema

**Input**: Design documents from `/specs/003-hierarchical-lesson-schema/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Per the project constitution, tests are REQUIRED — unit tests for
business logic and integration tests for critical paths are included.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Testing toolchain and shared utilities that every phase depends on.

- [x] T001 Add `vitest` and `@vitest/coverage-v8` to devDependencies in `package.json` and create `vitest.config.ts` at repo root
- [x] T002 [P] Create slug/anchor generation utility in `src/lib/utils/slugify.ts` — lowercase, hyphen-separated, ASCII-only, matching remark-gfm heading ID output
- [x] T003 [P] Write unit tests for slugify utility in `src/lib/utils/slugify.test.ts` covering title cases, symbols, consecutive hyphens, edge inputs

**Checkpoint**: `npx vitest run src/lib/utils/slugify.test.ts` passes before proceeding.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migration and shared Zod validation — MUST be complete before
any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Update `src/lib/db/schema.ts` — add `lesson_sections` table (id, lesson_plan_id FK cascade, title, slug, content_markdown, display_order, created_at, updated_at; UNIQUE(lesson_plan_id, slug)), add `lesson_items` table (id, section_id FK cascade, title, anchor_id, display_order, created_at, updated_at; UNIQUE(section_id, anchor_id)), remove `content` field from `lesson_plans`, define Drizzle `relations()` for lesson_plans→sections→items
- [x] T005 Run `npx drizzle-kit generate` to produce `drizzle/migrations/0001_hierarchical_lesson_schema.sql`, then augment it with a `DO $$ ... $$` data migration block that copies non-empty `lesson_plans.content` JSON to a default `lesson_sections` row, then `ALTER TABLE lesson_plans DROP COLUMN content`
- [x] T006 [P] Create `src/lib/db/validation.ts` with Zod schemas `SectionWriteSchema` (title required, slug/content_markdown/display_order optional with format validation) and `ItemWriteSchema` (title required, anchor_id/display_order optional with format validation)

**Checkpoint**: `npx drizzle-kit migrate` succeeds; `lesson_sections` and `lesson_items`
tables exist; `lesson_plans.content` column is gone; existing `chat_messages` rows intact.

---

## Phase 3: User Story 1 — Chat Scoped to Lesson Plan (Priority: P1) 🎯 MVP

**Goal**: `GET /api/lesson-plans/[id]` returns the lesson plan with its full
section+item hierarchy in a single fetch, so chat sessions can resolve the
complete plan structure.

**Independent Test**: Call `GET /api/lesson-plans/[id]` for a plan with 2 sections
(2 items each). Response includes `sections[].items[]` ordered by `display_order`.
No N+1 queries observed in DB logs.

### Tests for User Story 1 (REQUIRED per constitution)

> Write tests FIRST; ensure they FAIL before updating the route.

- [x] T007 [P] [US1] Write Playwright integration test in `tests/api/lesson-hierarchy.spec.ts` — seed a lesson plan with 2 sections and 4 items, assert `GET /api/lesson-plans/[id]` response shape includes `sections[0].items`, assert ordering by `display_order`, assert 401 when unauthenticated

### Implementation for User Story 1

- [x] T008 [US1] Update `GET` handler in `src/app/api/lesson-plans/[id]/route.ts` to use `db.query.lesson_plans.findFirst({ with: { sections: { orderBy: asc(display_order), with: { items: { orderBy: asc(display_order) } } } } })` and return `chatMessages` alongside the enriched `lessonPlan`

**Checkpoint**: `npx playwright test tests/api/lesson-hierarchy.spec.ts` passes.
User Story 1 is independently functional — chat sessions now resolve full hierarchy.

---

## Phase 4: User Story 2 — Hierarchical Outline Navigation (Priority: P2)

**Goal**: CRUD API routes for sections and items, enabling the lesson outline to
be built and maintained. Items link to `/#anchor-id` within the parent section.

**Independent Test**: Create a section via `POST /api/lesson-plans/[id]/sections`,
create two items in it, fetch `GET /api/lesson-plans/[id]/sections/[sectionId]`,
confirm items appear ordered. Attempt duplicate slug → 409. Delete section → items
cascade-deleted.

### Tests for User Story 2 (REQUIRED per constitution)

- [x] T009 [P] [US2] Write Playwright integration tests in `tests/api/sections-items.spec.ts` covering: POST section (201 + 409 conflict), GET section with items, PATCH section title, DELETE section (verify item cascade), POST item (201 + 409 conflict), PATCH item, DELETE item, auth enforcement (401 on all routes)

### Implementation for User Story 2

- [x] T010 [P] [US2] Create `src/app/api/lesson-plans/[id]/sections/route.ts` — `GET` returns ordered sections list; `POST` validates with `SectionWriteSchema`, derives slug from title via `slugify()` if omitted, appends at `MAX(display_order)+10`, catches `23505` unique violation and returns 409
- [x] T011 [P] [US2] Create `src/app/api/lesson-plans/[id]/sections/[sectionId]/route.ts` — `GET` returns section with ordered items; `PATCH` validates with partial `SectionWriteSchema`, catches slug 409; `DELETE` cascades via DB FK; all handlers verify plan ownership (`lesson_plan.user_id === user.id`)
- [x] T012 [P] [US2] Create `src/app/api/lesson-plans/[id]/sections/[sectionId]/items/route.ts` — `POST` validates with `ItemWriteSchema`, derives `anchor_id` from title via `slugify()` if omitted, appends at `MAX(display_order)+10`, catches `23505` and returns 409
- [x] T013 [US2] Create `src/app/api/lesson-plans/[id]/sections/[sectionId]/items/[itemId]/route.ts` — `PATCH` validates with partial `ItemWriteSchema`, catches anchor_id 409; `DELETE` removes item; both verify ownership chain (item → section → plan → user)
- [x] T014 [US2] Create `src/app/lessons/[id]/page.tsx` — lesson plan page that fetches `GET /api/lesson-plans/[id]`, renders a hierarchical outline sidebar (section titles as headings, items as links pointing to `/lessons/[id]/sections/[slug]#[anchorId]`), and renders the first section's content by default

**Checkpoint**: `npx playwright test tests/api/sections-items.spec.ts` passes.
User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 — Direct Anchor Links to Items (Priority: P3)

**Goal**: URL routing for section content pages with anchor-scroll support.
`/lessons/[id]/sections/[slug]#[anchorId]` navigates to the correct heading.

**Independent Test**: Navigate to `/lessons/[id]/sections/prerequisites#required-tools`
in a browser. Confirm: section content loads, page scrolls to the `#required-tools`
heading. Navigate to a non-existent anchor — page loads from top without error.

### Implementation for User Story 3

- [x] T015 [P] [US3] Create `src/app/lessons/[id]/sections/[slug]/page.tsx` — fetches section by slug from `GET /api/lesson-plans/[id]/sections` (or direct DB query), renders `content_markdown` via `<ReactMarkdown remarkPlugins={[remarkGfm]}>`, passing heading components that set `id` attributes matching the anchor IDs so browser `#fragment` navigation works natively
- [x] T016 [US3] Add graceful fallback to `src/app/lessons/[id]/sections/[slug]/page.tsx` for missing section slug — return Next.js `notFound()` for unknown slugs; for unknown anchor IDs the browser-native behavior (scroll to top) is sufficient, no additional code required

**Checkpoint**: All three user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, structured logging, and cleanup.

- [x] T017 [P] Add structured error logging (`console.error({ route, error, userId })`) to all new API routes in `src/app/api/lesson-plans/[id]/sections/` and nested item routes
- [x] T018 [P] Verify `src/app/api/lesson-plans/[id]/route.ts` PATCH and DELETE handlers have no remaining references to the removed `content` field
- [x] T019 Run `npx vitest run && npx playwright test` — confirm all tests pass; complete the quickstart.md validation checklist in `specs/003-hierarchical-lesson-schema/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002 and T003 run in parallel
- **Foundational (Phase 2)**: Depends on T001 (vitest); T004 → T005 sequential (schema before migration); T006 parallel with T005
- **US1 (Phase 3)**: Depends on Phase 2 completion — T007 parallel with T008 (test-first TDD)
- **US2 (Phase 4)**: Depends on Phase 2 completion — T009 parallel with T010/T011/T012/T013; T014 after T010
- **US3 (Phase 5)**: Depends on Phase 4 completion (needs section routes for data fetching)
- **Polish (Phase 6)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — independent, no dependency on US2/US3
- **US2 (P2)**: Starts after Phase 2 — independent, no dependency on US3
- **US3 (P3)**: Starts after Phase 4 (US2 must provide section data routes)

### Within Each User Story

- Tests written FIRST (must fail before implementation)
- Schema/models before services before routes
- Story complete before moving to next priority

---

## Parallel Example: User Story 2

```text
# All can launch together once Phase 2 completes:
Task: T009 — Write integration tests for section/item CRUD
Task: T010 — Create sections list+create route
Task: T011 — Create section detail route (GET/PATCH/DELETE)
Task: T012 — Create items create route

# T013 and T014 start after their file-level prerequisites:
Task: T013 — Create item detail route (PATCH/DELETE)
Task: T014 — Create lesson plan outline page (after T010 for API contract reference)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema + migration — CRITICAL)
3. Complete Phase 3: User Story 1 (update GET route to return hierarchy)
4. **STOP and VALIDATE**: `GET /api/lesson-plans/[id]` returns full hierarchy; chat sessions resolve plan structure
5. Demo and confirm before continuing

### Incremental Delivery

1. Setup + Foundational → Schema migrated, slugify tested
2. US1 → Chat can resolve full hierarchy (MVP)
3. US2 → Section/item CRUD + outline page
4. US3 → Deep-link anchor navigation
5. Polish → Logging, cleanup, final test run

### Parallel Team Strategy

With multiple developers after Phase 2:

- Developer A: US1 (T007, T008)
- Developer B: US2 API routes (T009–T013)
- Developer C: US2 + US3 UI pages (T014–T016)

---

## Notes

- `[P]` tasks = different files, no cross-task dependencies at that point
- `[Story]` label maps task to spec.md user story for traceability
- T002 (`slugify.ts`) is the single shared utility — import it in all routes that derive slugs/anchor IDs
- The `23505` Postgres error code is the unique constraint violation; catch it by name in a try/catch and return 409
- Drizzle `db.query` API requires `relations()` declarations in schema.ts (T004) before the relational `with` syntax works in T008
- Commit after each phase checkpoint to keep history clean
