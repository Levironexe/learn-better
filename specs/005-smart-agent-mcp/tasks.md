# Tasks: Smart Agent Behavior and MCP Integration

**Input**: Design documents from `/specs/005-smart-agent-mcp/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Required per project constitution — unit tests for intent classifier, integration tests for proposal acceptance flow.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies required by the feature.

- [X] T001 Install `@modelcontextprotocol/sdk` dependency — run `npm install @modelcontextprotocol/sdk` and verify package.json updated

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and AI helpers required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `data-lesson-plan-proposal` data part type to `src/types/ai.ts` — extend `LessonPlanDataParts` union with `{ type: 'data-lesson-plan-proposal'; data: { proposalId: string; title: string; content: LessonPlanContent; mode: 'create' | 'edit'; lessonPlanId?: string } }`
- [X] T003 Add `IntentSchema`, `INTENT_SYSTEM_PROMPT`, and `IntentClassification` type to `src/lib/ai/index.ts` — z.enum(['conversational','create_lesson','edit_lesson']), rationale: string; add `ProposalState` type export

**Checkpoint**: Foundation ready — all user stories can now begin.

---

## Phase 3: User Story 1 — Intent-Aware Lesson Generation (Priority: P1) 🎯 MVP

**Goal**: Agent classifies intent before acting; casual messages get a conversational reply only; lesson-intent messages generate a proposal (not persisted) with Accept/Decline UI.

**Independent Test**: Send "hi", "thanks", "teach me Python basics" — verify only the last triggers a proposal banner. Accept the proposal and confirm the lesson plan is persisted. Decline and confirm nothing is saved.

### Tests for User Story 1

- [X] T004 [P] [US1] Write unit tests for `IntentSchema` classification logic in `src/lib/ai/__tests__/intent.test.ts` — test conversational / create_lesson / edit_lesson branches, verify schema parses correctly
- [X] T005 [P] [US1] Write integration test for accept-proposal endpoint in `src/app/api/lesson-plans/accept-proposal/__tests__/route.test.ts` — test 200 (valid payload), 400 (missing fields), 401 (no auth)

### Implementation for User Story 1

- [X] T006 [P] [US1] Refactor `src/app/api/chat/route.ts` — Phase 1: `generateObject(IntentSchema)` to classify intent; Phase 2 (create_lesson only): `generateObject(LessonPlanContentSchema)` then write `data-lesson-plan-proposal` to stream (no db.insert/update); Phase 3: `streamText` conversational reply always; remove all db.insert/update calls from this route
- [X] T007 [P] [US1] Create `src/app/api/lesson-plans/accept-proposal/route.ts` — POST, auth check, validate `{ title, content: LessonPlanContentSchema, lessonPlanId? }`, upsert lesson_plans, delete existing sections (cascade), call persistSections(), return `{ lessonPlanId, title }`
- [X] T008 [P] [US1] Create `src/app/api/lesson-plans/decline-proposal/route.ts` — POST, auth check, validate `{ proposalId, lessonPlanId? }`, return 204 (no content)
- [X] T009 [P] [US1] Create `src/components/chat-panel/proposal-banner.tsx` — client component, props: `proposal: ProposalState, onAccept: () => Promise<void>, onDecline: () => void`; states: `idle | accepting | error`; shows "Create this lesson plan?" for create mode
- [X] T010 [US1] Update `src/components/chat-panel/chat-panel.tsx` — accept `pendingProposal: ProposalState | null`, `onAccept`, `onDecline` props; render `<ProposalBanner>` when pendingProposal is non-null (depends on T009)
- [X] T011 [US1] Update `src/app/(protected)/page.tsx` — add `pendingProposal` state; add `handleAccept` (POST accept-proposal → set activePlan + activePlanId, clear pendingProposal); add `handleDecline` (POST decline-proposal, clear pendingProposal); watch messages for `data-lesson-plan-proposal` parts (replace existing `data-lesson-plan-update` watcher); pass new props to `<DocsPanel>` and `<ChatPanel>` (depends on T006, T007, T008, T010)

**Checkpoint**: User Story 1 fully functional. Casual messages get conversational reply only. Lesson requests show proposal banner. Accept saves the plan; Decline discards it.

---

## Phase 4: User Story 2 — Edit Existing Lesson Content via Chat (Priority: P2)

**Goal**: Agent detects edit intent when an active lesson plan is loaded, fetches current sections from DB, generates an updated full plan as a proposal (mode: 'edit'), and applies changes only after user confirms.

**Independent Test**: Load an existing lesson plan. Type "add a section about testing". Verify proposal banner shows "Apply these edits?". Accept and confirm only the new section is added. Decline and confirm plan is unchanged.

### Tests for User Story 2

- [X] T012 [P] [US2] Extend `src/lib/ai/__tests__/intent.test.ts` — add tests for edit_lesson intent classification; verify lessonPlanId context is propagated correctly in the prompt
- [X] T013 [P] [US2] Write integration test for edit proposal flow in `src/app/api/lesson-plans/accept-proposal/__tests__/route.test.ts` — test upsert with existing lessonPlanId (edit mode), verify sections replaced not appended

### Implementation for User Story 2

- [X] T014 [US2] Update `src/app/api/chat/route.ts` — in Phase 2, handle `edit_lesson` intent: if lessonPlanId present, fetch current sections from DB and build edit context prompt (inject existing sections + user edit request); generate updated full LessonPlanContent; write `data-lesson-plan-proposal` with `mode: 'edit'` and `lessonPlanId`; if no active plan, skip generation and instruct conversational reply to prompt user to create one first (depends on T006)
- [X] T015 [US2] Update `src/components/chat-panel/proposal-banner.tsx` — show "Apply these edits?" label when `proposal.mode === 'edit'`; keep "Create this lesson plan?" for create mode (depends on T009)

**Checkpoint**: User Stories 1 and 2 both independently functional. Edit flow correctly targets existing plans without replacing unrelated sections.

---

## Phase 5: User Story 3 — Web Search Integration (Priority: P3)

**Goal**: When `BRAVE_API_KEY` is set, the lesson generation phase uses MCP-bridged web search tools to fetch current information. If the key is absent, generation proceeds normally with no error.

**Independent Test**: Set `BRAVE_API_KEY` in `.env.local`. Request "teach me about the latest Next.js 16 features". Verify the proposal includes content about recent features. Unset the key and repeat — verify generation still works, no error thrown.

### Tests for User Story 3

- [X] T016 [P] [US3] Write unit tests for `createBraveSearchTools()` in `src/lib/ai/__tests__/mcp.test.ts` — test that `{}` is returned when `BRAVE_API_KEY` is unset; test that MCP client is constructed with correct env var when key is present (mock StdioClientTransport)

### Implementation for User Story 3

- [X] T017 [P] [US3] Create `src/lib/ai/mcp.ts` — export `createBraveSearchTools()`: creates `@modelcontextprotocol/sdk` Client + StdioClientTransport spawning `npx -y @modelcontextprotocol/server-brave-search`; passes `BRAVE_API_KEY` from env; returns AI SDK-compatible tool definitions; returns `{}` if `BRAVE_API_KEY` not set; caller must close client in `finally` block
- [X] T018 [US3] Update `src/app/api/chat/route.ts` — in Phase 2 (lesson intents only), call `createBraveSearchTools()`; attach returned tools to `generateObject` call; close MCP client in `finally` block; no error surface to user if MCP client fails (depends on T017, T006)

**Checkpoint**: All three user stories independently functional. Web search enhances lesson quality when configured.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 [P] Update `CLAUDE.md` with `@modelcontextprotocol/sdk` in active technologies section
- [X] T020 [P] Verify edge cases from `specs/005-smart-agent-mcp/quickstart.md` — ambiguous messages ("interesting"), offline Accept, edit request with no active plan, missing BRAVE_API_KEY
- [X] T021 Remove any stale `data-lesson-plan-update` handling from `src/app/(protected)/page.tsx` if the watcher was not already replaced in T011

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **User Stories (Phases 3–5)**: All depend on Phase 2 completion
  - US2 (Phase 4) depends on T006 (chat route refactor) from US1 Phase 3
  - US3 (Phase 5) depends on T006 from US1 Phase 3
  - US1 must complete before US2 and US3 begin
- **Polish (Phase 6)**: Depends on Phases 3–5 completion

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — no dependency on US2/US3
- **US2 (P2)**: Depends on T006 (chat route), T009 (ProposalBanner) from US1
- **US3 (P3)**: Depends on T006 (chat route) from US1

### Within Each User Story

- Tests before implementation
- Types/models before services
- Services before routes
- Routes before frontend integration

### Parallel Opportunities

- T004, T005 (US1 tests) can run in parallel
- T006, T007, T008, T009 (US1 implementations) can run in parallel (different files)
- T012, T013 (US2 tests) can run in parallel
- T016 (US3 test), T017 (mcp.ts) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
Task: T004 — Intent unit tests
Task: T005 — Accept-proposal integration test

# Implementation in parallel (after tests fail):
Task: T006 — Refactor chat route
Task: T007 — Create accept-proposal route
Task: T008 — Create decline-proposal route
Task: T009 — Create ProposalBanner component

# Sequential after above:
Task: T010 — Update ChatPanel (needs T009)
Task: T011 — Update page.tsx (needs T006, T007, T008, T010)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Send "hi" (no proposal), send "teach me X" (proposal appears), Accept (plan saved), Decline (plan discarded)
5. Demo-ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Intent detection + Proposal flow (MVP — stops unwanted auto-generation)
3. US2 → Edit existing plans via chat
4. US3 → Web search enrichment
5. Each story independently shippable

---

## Notes

- [P] tasks = different files, no in-flight dependencies
- MCP client must always be closed in a `finally` block to avoid zombie child processes
- `data-lesson-plan-update` watcher in page.tsx must be replaced by `data-lesson-plan-proposal` watcher in T011 — do not leave both active
- `persistSections()` helper from existing lesson-plans route should be reused in accept-proposal route (T007) — do not duplicate
- US2's accept-proposal upsert logic: upsert lesson_plans row → DELETE existing sections WHERE lesson_plan_id = id → re-insert via persistSections()
