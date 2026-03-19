# Tasks: UI Polish & Refinements

**Input**: Design documents from `/specs/006-ui-polish-refinements/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Per the project constitution, tests are REQUIRED — unit tests for business logic and integration tests for critical paths MUST be included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create shared utility files used across multiple user stories

- [x] T001 Install `lucide-react` dependency via `pnpm add lucide-react`
- [x] T002 [P] Create clipboard utility with error handling in `src/lib/clipboard.ts` — export `copyToClipboard(text: string): Promise<boolean>` that wraps `navigator.clipboard.writeText` with try/catch, returns success boolean
- [x] T003 [P] Create reusable Skeleton component in `src/components/ui/skeleton.tsx` — base `Skeleton` component accepting `className` prop, renders `div` with `animate-pulse bg-muted rounded` classes. Also export `SidebarSkeleton` (5-7 bars with varying widths) and `ContentSkeleton` (title bar + 3-4 paragraph blocks)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core resize infrastructure that MUST be complete before user stories can be implemented

**⚠️ CRITICAL**: The resizable panel hook is foundational because US1 (panel layout) and the page.tsx integration depend on it

- [x] T004 Create `useResizablePanels` hook in `src/hooks/use-resizable-panels.ts` — implement pointer event-based drag handling, localStorage persistence (keys: `learn-better:panel-width`, `learn-better:chat-collapsed`), min/max width enforcement (15%-75% for right panel), collapse/expand toggle, and `user-select: none` on body during drag. Return `{ rightWidth, isCollapsed, isDragging, toggleCollapse, handleDragStart }`
- [x] T005 Create ResizablePanels component in `src/components/ui/resizable-panels.tsx` — accepts `leftPanel`, `rightPanel` ReactNode props; renders two flex children with a draggable divider (4px wide, expands on hover, `col-resize` cursor); includes collapse toggle button with chevron icon from lucide-react; uses `useResizablePanels` hook internally

### Tests for Foundational Phase

- [x] T006 [P] Unit test for `useResizablePanels` hook in `tests/unit/use-resizable-panels.test.ts` — test width clamping (min/max enforcement), collapse/expand toggle state, localStorage read/write for persistence, and default values when no stored state exists
- [x] T007 [P] Unit test for clipboard utility in `tests/unit/clipboard.test.ts` — test successful copy returns true, failed copy (API unavailable) returns false without throwing, and correct text is passed to `navigator.clipboard.writeText`

**Checkpoint**: Foundation ready — resizable panels and shared utilities available for all user stories

---

## Phase 3: User Story 1 — Resizable & Collapsible Chat Panel (Priority: P1) 🎯 MVP

**Goal**: Replace the fixed 60/40 panel layout with a resizable, collapsible split-panel that persists user preferences

**Independent Test**: Drag the divider between panels to resize, click the collapse toggle to hide/show chat, refresh the page and verify widths persist

### Implementation for User Story 1

- [x] T008 [US1] Update `src/app/(protected)/page.tsx` — replace the hardcoded `w-[60%]` / `w-[40%]` flex layout with the `ResizablePanels` component, passing `LessonPlanList + DocsPanel` as left panel and `ChatPanel` as right panel. Remove the inline width classes and `border-r` from the left panel (the ResizablePanels divider handles the border)
- [x] T009 [US1] Update `src/components/chat-panel/chat-panel.tsx` — ensure the chat panel renders correctly when its parent width changes dynamically (verify no fixed-width assumptions); the panel should fill its flex container

### Tests for User Story 1

- [x] T010 [US1] Integration test for panel layout in `tests/integration/panel-layout.test.ts` — test that ResizablePanels renders both panels, collapse toggle hides right panel and left panel fills width, and width persistence roundtrips through localStorage

**Checkpoint**: User Story 1 complete — panels resize, collapse, and persist

---

## Phase 4: User Story 2 — Improved Content Rendering (Priority: P1)

**Goal**: Fix the "wall of text" markdown rendering with proper typography, heading hierarchy, list styling, and code block formatting

**Independent Test**: View a lesson section with mixed markdown (headings, lists, bold, code, blockquotes) and verify clear visual hierarchy

### Implementation for User Story 2

- [x] T011 [US2] Update prose styles in `src/app/globals.css` — enhance the `.prose` CSS rules: h2 at 1.375rem/700 weight with 1.75rem top margin, h3 at 1.125rem/600 weight, h4 at 1rem/600 weight; paragraphs with 0.75rem bottom margin and 1.7 line-height; ul/ol with 1.5rem padding-left and visible bullets/numbers; li with 0.25rem bottom margin; inline code with bg-muted px-1.5 py-0.5 rounded text-[0.875em]; pre with bg-muted p-4 rounded-xl overflow-x-auto; blockquote with 3px left border pl-4 bg-muted/30 italic. Ensure all styles work in both light and dark themes
- [x] T012 [US2] Review and update `src/components/docs-panel/docs-content.tsx` — verify `react-markdown` with `remark-gfm` correctly applies the updated prose classes; ensure the prose container uses `prose prose-sm dark:prose-invert max-w-none` and the content wrapper allows proper spacing between subsections (mb-8 or similar)

**Checkpoint**: User Story 2 complete — markdown content renders with proper visual hierarchy

---

## Phase 5: User Story 3 — Section Action Icons with Copy (Priority: P2)

**Goal**: Replace text Edit/Delete buttons with icon buttons (pencil, clipboard, trash) and add copy-to-clipboard functionality

**Independent Test**: Click the copy icon on a section, paste in a text editor, and verify the full markdown content was copied

### Implementation for User Story 3

- [x] T013 [P] [US3] Update section header actions in `src/components/docs-panel/docs-content.tsx` — replace the text "Edit" and "Delete" buttons with icon buttons using lucide-react: `Pencil` for edit, `Copy`/`Check` for copy (toggles on success), `Trash2` for delete. Each button: 28x28px touchable area, 16px icon, `hover:bg-muted rounded-lg` hover effect, `aria-label` for accessibility ("Edit section", "Copy section", "Delete section"). Add `gap-1` spacing between icons
- [x] T014 [US3] Implement copy-to-clipboard handler in `src/components/docs-panel/docs-content.tsx` — on copy icon click, collect all subsection markdown bodies for the section (join with newlines), call `copyToClipboard()` from `src/lib/clipboard.ts`, on success swap the Copy icon to Check icon for 2 seconds using local state, then revert. Handle failure by logging error (no user-facing error needed per assumptions)

**Checkpoint**: User Story 3 complete — section icons work, copy copies full markdown to clipboard

---

## Phase 6: User Story 4 — Redesigned Chat Input (Priority: P2)

**Goal**: Redesign the chat input with an embedded circular send button (ArrowUp icon) inside the text area container

**Independent Test**: Type a message, see the send button inside the input area, click it or press Enter to send

### Implementation for User Story 4

- [x] T015 [US4] Redesign `src/components/chat-panel/chat-input.tsx` — restructure layout: outer container `div` with `border border-border bg-background rounded-xl p-2 flex items-end gap-2`; textarea becomes borderless (`border-0 bg-transparent focus:ring-0 resize-none flex-1`) with auto-grow behavior (min 1 row, max-h-[120px], auto-resize via scrollHeight on input); send button becomes a 32x32px circle (`w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shrink-0`) using `ArrowUp` icon from lucide-react (size 18); disabled state uses `opacity-30`; remove the old separate send button layout; preserve existing Enter/Shift+Enter submit behavior and loading state

**Checkpoint**: User Story 4 complete — chat input has embedded circular send button

---

## Phase 7: User Story 5 — Skeleton Loading States (Priority: P2)

**Goal**: Show skeleton placeholders in the left panel while content loads from the database

**Independent Test**: Load a lesson plan (optionally throttle network) and verify skeleton placeholders appear before content

### Implementation for User Story 5

- [x] T016 [P] [US5] Add skeleton loading to `src/components/docs-panel/docs-sidebar.tsx` — when sections data is not yet available (loading state), render `SidebarSkeleton` from `src/components/ui/skeleton.tsx` instead of the section navigation list
- [x] T017 [P] [US5] Add skeleton loading to `src/components/docs-panel/docs-panel.tsx` — when lesson plan is loading (before data arrives, not during streaming updates), render `ContentSkeleton` from `src/components/ui/skeleton.tsx` in the content area. Replace the current "Generating lesson plan..." pulse text with the skeleton component for initial data fetches. Keep the pulse text for AI streaming state

**Checkpoint**: User Story 5 complete — skeleton placeholders appear during content loading

---

## Phase 8: User Story 6 — Increased Border Radius (Priority: P3)

**Goal**: Apply `rounded-xl` to all interactive bordered elements across the application

**Independent Test**: Visually inspect all buttons, inputs, and cards — all should have consistent rounded-xl corners

### Implementation for User Story 6

- [x] T018 [P] [US6] Update border radius in `src/components/chat-panel/chat-messages.tsx` — change chat message bubbles from `rounded-lg` to `rounded-xl`
- [x] T019 [P] [US6] Update border radius in `src/components/chat-panel/proposal-banner.tsx` — change the proposal banner container and its buttons from `rounded-lg` / existing radius to `rounded-xl`
- [x] T020 [P] [US6] Update border radius in `src/components/lesson-plan-list.tsx` — change lesson plan tab buttons from existing radius to `rounded-xl`
- [x] T021 [P] [US6] Update border radius in `src/components/docs-panel/section-editor.tsx` — change the modal container, textarea, buttons, and preview panel borders to `rounded-xl`
- [x] T022 [P] [US6] Update border radius in `src/components/navbar.tsx` — change any bordered elements (if present) to `rounded-xl`; update the theme toggle button in `src/components/theme-toggle.tsx` from `rounded-md` to `rounded-xl`

**Checkpoint**: User Story 6 complete — all bordered elements use rounded-xl consistently

---

## Phase 9: User Story 7 — Sign-Out Button Hover Effect (Priority: P3)

**Goal**: Add a hover background effect to the sign-out button matching the theme toggle button's styling

**Independent Test**: Hover over the sign-out button and compare with theme toggle hover — both should show background highlight

### Implementation for User Story 7

- [x] T023 [US7] Update `src/components/sign-out-button.tsx` — change from text-only styling (`text-xs text-muted-foreground hover:text-foreground`) to button-like styling matching the theme toggle: add `p-2 rounded-xl hover:bg-muted transition-colors` classes. Keep the text content "Sign out" and the sign-out functionality unchanged

**Checkpoint**: User Story 7 complete — sign-out button has consistent hover effect

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, dark mode check, and cross-story consistency

- [x] T024 [P] Verify dark mode compatibility across all changes — toggle between light and dark themes and confirm: prose styles render correctly, skeleton colors use muted tokens, icon buttons have appropriate contrast, resizable panel divider is visible, chat input container border is visible, send button contrast works in both themes
- [x] T025 [P] Verify accessibility — confirm all icon buttons have `aria-label` attributes, drag handle is keyboard-operable or has an alternative resize mechanism, color contrast ratios meet WCAG AA for interactive elements
- [x] T026 Run `pnpm test` to verify all existing tests still pass and new tests (T006, T007, T010) pass
- [x] T027 Run quickstart.md verification checklist (all 10 items) to confirm end-to-end feature completeness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (lucide-react installed) — BLOCKS User Story 1
- **User Story 1 (Phase 3)**: Depends on Phase 2 (ResizablePanels component)
- **User Story 2 (Phase 4)**: Depends on Phase 1 only (no foundational dependency) — can run in parallel with Phase 2
- **User Story 3 (Phase 5)**: Depends on T001 (lucide-react) and T002 (clipboard utility)
- **User Story 4 (Phase 6)**: Depends on T001 (lucide-react)
- **User Story 5 (Phase 7)**: Depends on T003 (Skeleton component)
- **User Story 6 (Phase 8)**: No dependencies — purely CSS class changes
- **User Story 7 (Phase 9)**: No dependencies — purely CSS class changes
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 foundation (ResizablePanels). Independent of all other stories.
- **US2 (P1)**: Fully independent — CSS-only changes. Can start immediately after Phase 1.
- **US3 (P2)**: Requires T001 (icons) and T002 (clipboard). Independent of other stories.
- **US4 (P2)**: Requires T001 (icons). Independent of other stories.
- **US5 (P2)**: Requires T003 (Skeleton component). Independent of other stories.
- **US6 (P3)**: Fully independent — can start any time. Minor conflict risk with US4 on chat-input.tsx (same file, different sections).
- **US7 (P3)**: Fully independent — can start any time.

### Parallel Opportunities

- T002 and T003 can run in parallel (different files, no dependencies)
- T006 and T007 can run in parallel (different test files)
- US2 (prose styles) can run in parallel with Phase 2 foundational work
- US3, US4, US5 can all run in parallel after Phase 1 setup
- US6 tasks (T018-T022) are all parallelizable (different component files)
- US7 can run in parallel with any other story

---

## Parallel Example: Maximum Parallelism After Phase 1

```bash
# After T001 (lucide-react installed), these can all run concurrently:

# Stream 1: Foundational
Task: T004 "Create useResizablePanels hook in src/hooks/use-resizable-panels.ts"
Task: T005 "Create ResizablePanels component in src/components/ui/resizable-panels.tsx"

# Stream 2: US2 (prose styles — no foundational dependency)
Task: T011 "Update prose styles in src/app/globals.css"
Task: T012 "Review docs-content.tsx prose rendering"

# Stream 3: US3 (icons + copy)
Task: T013 "Update section header actions in docs-content.tsx"
Task: T014 "Implement copy-to-clipboard handler"

# Stream 4: US6 (border radius — all [P] tasks)
Task: T018-T022 "Update border radius across all components"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: US1 — Resizable panels (T008-T010)
4. Complete Phase 4: US2 — Content rendering (T011-T012)
5. **STOP and VALIDATE**: Test panel resize + content rendering independently
6. Deploy/demo if ready — these two P1 stories deliver the most user value

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (panels) + US2 (prose) → **MVP** — core layout and content quality
3. US3 (icons/copy) + US4 (chat input) + US5 (skeleton) → **Enhanced UX** — interaction polish
4. US6 (border radius) + US7 (sign-out hover) → **Visual Consistency** — cosmetic polish
5. Polish phase → **Release ready**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 (prose styles) and US6 (border radius) are CSS-heavy — low conflict risk
- US3 and US4 both modify chat/docs components but touch different sections of those files
- T013 and T014 modify the same file (docs-content.tsx) — execute sequentially within US3
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
