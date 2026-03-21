# Tasks: MCP Fix & Streaming Status Indicators

**Input**: Design documents from `/specs/007-mcp-fix-streaming-status/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per the project constitution, tests are REQUIRED — unit tests for business logic and integration tests for critical paths MUST be included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (Next.js App Router)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared modules and types that all user stories depend on

- [x] T001 [P] Create tool status label mapping module at `src/lib/ai/tool-status.ts` — export `getToolStatusLabel(toolName: string): string` with mappings: `brave_web_search` → "Searching the web", `generate_lesson` → "Generating lesson", `classify_intent` → "Understanding your request", fallback → "Processing ({toolName})"
- [x] T002 [P] Extend `LessonPlanDataParts` type in `src/types/ai.ts` — add `'tool-status': { tool: string; status: 'running' | 'complete'; label: string }` to the existing type union

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Diagnose and fix the MCP connection so web search actually works

**⚠️ CRITICAL**: US1 cannot be verified until MCP connectivity is confirmed

- [x] T003 Add structured error logging to `src/lib/ai/mcp.ts` — wrap `client.connect(transport)` and `client.listTools()` in try/catch with `console.error` logging that includes the error message and stack. Log successful connection with tool count at `console.info` level
- [x] T004 Fix hardcoded input schema in `src/lib/ai/mcp.ts` — replace the hardcoded `z.object({ query: z.string() })` with the MCP tool's own `inputSchema` from `mcpTool.inputSchema`. Use AI SDK's `jsonSchema()` helper to pass the raw JSON Schema directly instead of converting to Zod
- [x] T005 Verify `BRAVE_API_KEY` is set in `.env.local` — if missing, add a placeholder entry and document in `quickstart.md`. Confirm the MCP server starts successfully by checking terminal logs during `npm run dev`

**Checkpoint**: MCP connection established, tools listed in server logs, ready for integration

---

## Phase 3: User Story 1 — Agent Uses Web Search During Lesson Creation (Priority: P1) 🎯 MVP

**Goal**: The agent successfully invokes the Brave Search MCP tool during lesson creation and incorporates web results into the generated lesson content

**Independent Test**: Ask the agent to create a lesson on a current-events topic. Verify terminal logs show MCP search execution and the generated lesson contains current information.

### Tests for User Story 1 (REQUIRED per constitution)

- [x] T006 [P] [US1] Unit test for `getToolStatusLabel` in `tests/unit/tool-status.test.ts` — test all known mappings return correct labels, test unknown tool name returns fallback format, test empty string input
- [x] T007 [P] [US1] Unit test for MCP tool creation in `tests/unit/mcp-tools.test.ts` — mock `@modelcontextprotocol/sdk` client, verify `createBraveSearchTools()` returns null when `BRAVE_API_KEY` is unset, verify tools are returned with correct structure when connected, verify error logging on connection failure

### Implementation for User Story 1

- [x] T008 [US1] Update error handling in chat route `src/app/api/chat/route.ts` — replace `.catch(() => null)` on MCP creation (line 98) with `.catch((err) => { console.error('[MCP] Failed to create search tools:', err); return null })` so failures are visible in logs
- [x] T009 [US1] Manual end-to-end verification — start dev server, send "Create a lesson about the latest AI safety research in 2026", confirm in terminal logs: (1) MCP connection success log, (2) tool call execution, (3) search results appended to system prompt, (4) lesson content includes current information

**Checkpoint**: Web search MCP tool is functional. Agent incorporates web results into lesson generation. Failures are logged, not silently swallowed.

---

## Phase 4: User Story 2 — User Sees Real-Time Status During Agent Work (Priority: P2)

**Goal**: The chat UI displays status indicators ("Searching the web...", "Generating lesson...") that appear when tool calls start and disappear when they complete

**Independent Test**: Trigger a lesson creation request. Observe status messages appearing inline in the chat panel during processing, then collapsing when each step finishes.

### Tests for User Story 2 (REQUIRED per constitution)

- [x] T010 [P] [US2] Component test for StatusIndicator in `tests/integration/status-indicator.test.ts` — render with `label="Searching the web"` and `status="running"`, verify visible with animation; render with `status="complete"`, verify hidden/collapsed. Use Vitest + React Testing Library (or jsdom).

### Implementation for User Story 2

- [x] T011 [P] [US2] Create `StatusIndicator` component at `src/components/chat-panel/status-indicator.tsx` — a small inline component that renders an animated pulsing dot + label text (e.g., "Searching the web..."). Props: `label: string`. Uses Tailwind CSS v4 for styling. Include a subtle `animate-pulse` on the dot. The component renders left-aligned in the message flow area.
- [x] T012 [US2] Emit `data-tool-status` data parts in `src/app/api/chat/route.ts` — add `writer.write()` calls at each processing phase boundary:
  - Before intent classification: `{ type: 'data-tool-status', data: { tool: 'classify_intent', status: 'running', label: getToolStatusLabel('classify_intent') } }`
  - After intent classification: `{ type: 'data-tool-status', data: { tool: 'classify_intent', status: 'complete', ... } }`
  - Before MCP search (if mcp available): `running` for `brave_web_search`
  - After MCP search: `complete` for `brave_web_search`
  - Before lesson generation: `running` for `generate_lesson`
  - After lesson generation: `complete` for `generate_lesson`
  - Import `getToolStatusLabel` from `@/lib/ai/tool-status`
- [x] T013 [US2] Update `ChatMessages` component in `src/components/chat-panel/chat-messages.tsx` — for assistant messages, check `msg.parts` for `data-tool-status` parts. Collect all status parts: for each unique `tool`, find the latest status. If `status === 'running'` (and no subsequent `complete` for that tool), render a `<StatusIndicator label={part.data.label} />` below the text content. Import `StatusIndicator` from `./status-indicator`.

**Checkpoint**: Status indicators appear and disappear during agent processing. Chat UI shows "Understanding your request...", "Searching the web...", "Generating lesson..." at appropriate times.

---

## Phase 5: User Story 3 — Status Indicators for All Tool Types (Priority: P3)

**Goal**: The status system is extensible — adding a new tool status label requires only updating the mapping, not the UI component

**Independent Test**: Add a temporary dummy tool name to the mapping, verify the StatusIndicator renders it correctly without any component changes.

### Implementation for User Story 3

- [x] T014 [US3] Add fallback rendering test in `tests/unit/tool-status.test.ts` — verify that `getToolStatusLabel('unknown_new_tool')` returns `"Processing (unknown_new_tool)"`, confirming that any future tool gets a reasonable default label without code changes to the indicator
- [x] T015 [US3] Verify extensibility by adding a test mapping — temporarily add `'generate_quiz': 'Generating quiz'` to the label map in `src/lib/ai/tool-status.ts`, verify it renders correctly via the existing `StatusIndicator`, then remove the test mapping. Document this extensibility pattern in a code comment in `tool-status.ts`

**Checkpoint**: Status system confirmed extensible. New tools get automatic fallback labels. Adding a custom label is a one-line change.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T016 Verify all edge cases from spec — test: (1) missing `BRAVE_API_KEY` → graceful fallback, no error shown to user; (2) MCP server fails to start → logged, agent continues without search; (3) user sends new message during processing → current status clears
- [x] T017 Run full test suite — execute `npx vitest run` and confirm all new tests pass alongside existing tests
- [x] T018 Run quickstart.md validation — follow all verification steps in `specs/007-mcp-fix-streaming-status/quickstart.md` end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: No strict dependency on Phase 1, but T004 is the critical MCP fix
- **User Story 1 (Phase 3)**: Depends on Phase 1 (T001 for labels) and Phase 2 (T003-T005 for MCP fix)
- **User Story 2 (Phase 4)**: Depends on Phase 1 (T001, T002 for types) — can start in parallel with US1
- **User Story 3 (Phase 5)**: Depends on US2 completion (T011, T012, T013 must exist)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — MCP must work first
- **User Story 2 (P2)**: Depends on Setup (Phase 1) — needs types and label mapping. Independent of US1.
- **User Story 3 (P3)**: Depends on US2 — validates the extensibility of what US2 built

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types/models before services
- Backend (route changes) before frontend (component changes)
- Core implementation before integration

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T006 and T007 can run in parallel (different test files)
- T010 and T011 can run in parallel (different files, no dependency)
- US1 and US2 can start in parallel after Setup phase (different concerns: MCP fix vs UI indicators)

---

## Parallel Example: User Story 2

```bash
# Launch tests and component in parallel (different files):
Task: "Component test for StatusIndicator in tests/integration/status-indicator.test.ts"
Task: "Create StatusIndicator component at src/components/chat-panel/status-indicator.tsx"

# Then sequential (same file dependencies):
Task: "Emit data-tool-status data parts in src/app/api/chat/route.ts"
Task: "Update ChatMessages component in src/components/chat-panel/chat-messages.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004, T005)
3. Complete Phase 3: User Story 1 (T006–T009)
4. **STOP and VALIDATE**: Test MCP web search end-to-end
5. Agent can now use web search — core bug is fixed

### Incremental Delivery

1. Setup + Foundational → Types and MCP fix ready
2. Add User Story 1 → Web search works → **MVP shipped**
3. Add User Story 2 → Status indicators visible during processing
4. Add User Story 3 → Extensibility confirmed
5. Polish → Edge cases verified, full test suite green

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The MCP fix (Phase 2) is the critical path — everything else builds on it working
