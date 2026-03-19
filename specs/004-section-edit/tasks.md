# Tasks: Section Content Editing

**Input**: Design documents from `/specs/004-section-edit/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Note**: Backend PATCH and DELETE endpoints are already fully implemented.
All work is frontend. Tests are required per constitution.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: No new dependencies or config needed — stack is already in place.
This phase confirms the type extension that both user stories depend on.

- [X] T001 Extend `Section` type with optional `dbId?: string` field in `src/lib/ai/index.ts` (add to `SectionSchema` and re-export `Section` type)
- [X] T002 Populate `dbId` from the real section UUID in `page.tsx` `handleSelectPlan` — map `s.id` (UUID) to `section.dbId`

**Checkpoint**: `Section` objects loaded from DB now carry `dbId`. AI-streamed sections still have `dbId: undefined`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire `planId` and `dbId` through the component tree so both user stories can access them.

- [X] T003 Add `planId: string` prop to `DocsPanel` in `src/components/docs-panel/docs-panel.tsx` and pass it down to `DocsContent`
- [X] T004 Add `planId: string` and `onSectionSave`, `onSectionDelete` callback props to `DocsContent` in `src/components/docs-panel/docs-content.tsx`
- [X] T005 Pass `activePlanId` as `planId` to `<DocsPanel>` in `src/app/(protected)/page.tsx`
- [X] T006 Implement `handleSectionSave` in `src/app/(protected)/page.tsx` — replace updated section's subsections in `activePlan` state after a successful save
- [X] T007 Implement `handleSectionDelete` in `src/app/(protected)/page.tsx` — filter deleted section from `activePlan.sections` and reset active section to `sections[0]` or null

**Checkpoint**: Component tree is wired. `planId` and callbacks flow from `page.tsx` → `DocsPanel` → `DocsContent`.

---

## Phase 3: User Story 1 — Edit Section Content (Priority: P1) 🎯 MVP

**Goal**: User can click Edit, modify markdown content with live preview, Save to persist, or Cancel to discard.

**Independent Test**: Load a persisted lesson plan → click Edit on a section → modify text → verify live preview updates → Save → verify saved content renders in read mode. Also verify Cancel restores original content.

### Implementation

- [X] T008 [US1] Create `src/components/docs-panel/section-editor.tsx` — client component with props: `planId`, `sectionId`, `initialContent`, `onSave`, `onDelete`, `onCancel`
- [X] T009 [US1] Implement edit mode state machine in `section-editor.tsx`: states `idle | editing | saving | error`; Edit button triggers `editing`, Cancel returns to `idle`
- [X] T010 [US1] Implement split-pane edit layout in `section-editor.tsx`: `<textarea>` on left bound to local state, `<ReactMarkdown remarkPlugins={[remarkGfm]}>` on right rendering the same state in real time
- [X] T011 [US1] Implement Save handler in `section-editor.tsx` — `PATCH /api/lesson-plans/{planId}/sections/{sectionId}` with `{ content_markdown }`, set state to `saving` during request, call `onSave(newContent)` on success, set state to `error` on failure and show inline error message
- [X] T012 [US1] Render `<SectionEditor>` inside `DocsContent` only when `section.dbId` is defined — pass `planId`, `sectionId={section.dbId}`, `initialContent`, `onSave`, `onDelete`, `onCancel` props
- [X] T013 [US1] Verify Edit/Delete buttons are NOT rendered for AI-streamed sections (when `section.dbId` is undefined)

**Checkpoint**: User Story 1 fully functional — edit, live preview, save, cancel, error state all work.

---

## Phase 4: User Story 2 — Delete a Section (Priority: P2)

**Goal**: User can permanently delete a section with confirmation. View updates immediately.

**Independent Test**: Load a persisted lesson plan with multiple sections → click Delete → confirm → verify section removed from sidebar and content area → verify active section switches to another section.

### Implementation

- [X] T014 [US2] Implement Delete handler in `section-editor.tsx` — show `window.confirm()` prompt, on confirm send `DELETE /api/lesson-plans/{planId}/sections/{sectionId}`, on success call `onDelete()`, on failure show inline error
- [X] T015 [US2] Verify that after deletion the section disappears from the sidebar and `DocsPanel` switches to the next available section (handled by `handleSectionDelete` in `page.tsx`)
- [X] T016 [US2] Verify edge case: deleting the only remaining section shows the empty state in `DocsPanel`

**Checkpoint**: User Story 2 fully functional — delete with confirmation, immediate UI update, empty state handled.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T017 [P] Add loading indicator (disabled Save button + spinner or "Saving…" text) in `section-editor.tsx` during `saving` state
- [X] T018 [P] Add `deleting` state to `section-editor.tsx` — disable Delete button while delete request is in flight
- [X] T019 Validate that `DocsContent` still renders correctly for sections without `dbId` (no edit controls shown, read-only)
- [ ] T020 Run quickstart.md scenarios end-to-end and verify all happy paths and edge cases pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks both user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2; US2's Delete handler (T014) depends on `SectionEditor` component existing (T008)
- **Phase 5 (Polish)**: Depends on Phases 3 and 4

### User Story Dependencies

- **US1**: Independent after Foundational phase
- **US2**: Delete handler is added to the same `SectionEditor` component from US1 — implement after T008

### Parallel Opportunities

- T006 and T007 can run in parallel (different handlers in `page.tsx`)
- T008, T009, T010, T011 are sequential (same file, building up component)
- T014 can start as soon as T008 exists

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: T001–T002
2. Complete Phase 2: T003–T007
3. Complete Phase 3: T008–T013
4. **STOP and VALIDATE**: Edit, live preview, save, cancel all work for persisted sections

### Full Feature

5. Complete Phase 4: T014–T016
6. Complete Phase 5: T017–T020

---

## Notes

- Edit/Delete controls MUST be gated on `section.dbId !== undefined`
- `window.confirm()` is intentional for delete — upgrade to modal in a future task
- `content_markdown` edits do NOT sync back to `lesson_items` rows (tracked as known debt in plan.md)
- Commit after each phase checkpoint
