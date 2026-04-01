# Tasks: Content Styling Toolbar

**Input**: Design documents from `/specs/008-content-styling-toolbar/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to
- Include exact file paths in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared pure-logic module and TypeScript types that all user stories depend on.

- [x] T001 Create directory `src/lib/editor/` and scaffold `src/lib/editor/toolbar-actions.ts` — export the `TransformInput` and `TransformResult` TypeScript types per `data-model.md`; stub out all 13 exported functions (applyBold, applyItalic, applyUnderline, applyH1, applyH2, applyH3, applyUnorderedList, applyOrderedList, applyAlignLeft, applyAlignCenter, applyAlignRight, applyAlignJustify, applyLink) — each stub should return input unchanged for now

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the core text-transform logic that every toolbar button depends on.

- [x] T002 Implement inline wrap/unwrap helper in `src/lib/editor/toolbar-actions.ts` — a private helper `wrapOrUnwrap(input, openMarker, closeMarker, placeholder)` that: (1) with selection: if selected text is already wrapped in markers → unwrap; otherwise → wrap; (2) without selection: insert `openMarker + placeholder + closeMarker` at cursor. Return `TransformResult` with correct `newSelectionStart`/`newSelectionEnd`.
- [x] T003 Implement block prefix/toggle helper in `src/lib/editor/toolbar-actions.ts` — a private helper `prefixLines(input, prefix)` that: (1) finds all lines touched by the selection; (2) if ALL lines already start with the prefix → remove prefix from each (toggle); (3) otherwise → add prefix to each line. Update `newSelectionStart`/`newSelectionEnd` to encompass all modified lines.
- [x] T004 Implement alignment wrap/toggle helper in `src/lib/editor/toolbar-actions.ts` — a private helper `wrapAlignment(input, direction)` that: (1) `direction === 'left'` always removes any `<div style="text-align: ...">` wrapper; (2) other directions: if line(s) already wrapped in the same alignment → remove; if wrapped in different alignment → replace; otherwise → wrap in `<div style="text-align: direction">\n...\n</div>`.

**Checkpoint**: Core helpers complete — all user story implementations just call these helpers.

---

## Phase 3: User Story 1 — Apply Inline Text Formatting (Priority: P1) 🎯 MVP

**Goal**: Bold, Italic, Underline buttons work in the toolbar. Selecting text and clicking wraps/unwraps the selection. No selection inserts a placeholder.

**Independent Test**: Open section editor, select a word, click Bold → `**word**` appears; click Bold again → markers removed. Preview shows bold text.

- [x] T005 [P] [US1] Implement `applyBold`, `applyItalic`, `applyUnderline` in `src/lib/editor/toolbar-actions.ts` using the `wrapOrUnwrap` helper from T002: Bold uses `**`/`**`/`bold text`; Italic uses `*`/`*`/`italic text`; Underline uses `<u>`/`</u>`/`underline text`
- [x] T006 [P] [US1] Create `src/components/docs-panel/formatting-toolbar.tsx` — render a toolbar row with Bold (Bold icon), Italic (Italic icon), Underline (Underline icon) buttons. Props: `onAction: (action: string, url?: string) => void`. Each button: `type="button"`, `aria-label`, `title`, `tabIndex={0}`, focus-visible ring via Tailwind. Use `lucide-react` icons: `Bold`, `Italic`, `Underline`. Divider after underline.
- [x] T007 [US1] Wire toolbar into `src/components/docs-panel/section-editor.tsx` — import `FormattingToolbar`; add a `textareaRef` (`useRef<HTMLTextAreaElement>`); attach ref to the `<textarea>`; implement `handleToolbarAction(action, url?)` that: reads `selectionStart`/`selectionEnd` from the ref, calls the appropriate `applyXxx` function, calls `setDraft(result.newValue)`, then uses `requestAnimationFrame` to call `textareaRef.current.setSelectionRange(result.newSelectionStart, result.newSelectionEnd)`. Render `<FormattingToolbar onAction={handleToolbarAction} />` above the `<textarea>` in the editing state.

**Checkpoint**: P1 complete — Bold/Italic/Underline work with toggle. MVP deliverable.

---

## Phase 4: User Story 2 — Apply Block-Level Formatting (Priority: P2)

**Goal**: H1, H2, H3, Unordered List, Ordered List buttons work. Clicking prefixes the current line(s), clicking again removes the prefix.

**Independent Test**: Place cursor on a line, click H1 → `# ` prefixed; click H1 again → prefix removed. Select 3 lines, click Bullet → all 3 get `- ` prefix.

- [x] T008 [P] [US2] Implement `applyH1`, `applyH2`, `applyH3`, `applyUnorderedList`, `applyOrderedList` in `src/lib/editor/toolbar-actions.ts` using the `prefixLines` helper from T003: H1 → `# `, H2 → `## `, H3 → `### `, UL → `- `, OL → `1. `
- [x] T009 [P] [US2] Extend `src/components/docs-panel/formatting-toolbar.tsx` — add H1 (Heading1 icon), H2 (Heading2 icon), H3 (Heading3 icon), List (List icon), ListOrdered (ListOrdered icon) buttons after the first divider. Add a second divider after the list buttons. Same button props pattern: `type="button"`, `aria-label`, `title`, `tabIndex={0}`, focus-visible ring.

**Checkpoint**: P2 complete — all heading and list formatting works with toggle.

---

## Phase 5: User Story 3 — Set Text Alignment (Priority: P3)

**Goal**: AlignLeft, AlignCenter, AlignRight, AlignJustify buttons work. Clicking wraps the current line in an HTML alignment div; clicking Left removes any alignment wrapper.

**Independent Test**: Click Center on a line → preview shows centered text. Click Left → alignment removed, text returns to default.

- [x] T010 [P] [US3] Implement `applyAlignLeft`, `applyAlignCenter`, `applyAlignRight`, `applyAlignJustify` in `src/lib/editor/toolbar-actions.ts` using the `wrapAlignment` helper from T004
- [x] T011 [P] [US3] Extend `src/components/docs-panel/formatting-toolbar.tsx` — add AlignLeft (AlignLeft icon), AlignCenter (AlignCenter icon), AlignRight (AlignRight icon), AlignJustify (AlignJustify icon) buttons after the second divider. Add a third divider after align buttons. Same button props pattern.

**Checkpoint**: P3 complete — all 4 alignment options work with toggle.

---

## Phase 6: User Story 4 — Insert a Hyperlink (Priority: P4)

**Goal**: Link button triggers `window.prompt()` for a URL, then wraps selected text (or inserts a placeholder) in `[text](url)` markdown syntax.

**Independent Test**: Select "example", click Link, enter `https://example.com`, confirm → `[example](https://example.com)` appears; preview shows clickable link. Cancel prompt → no change.

- [x] T012 [P] [US4] Implement `applyLink` in `src/lib/editor/toolbar-actions.ts` — takes `TransformInput & { url: string }`: if `url` is empty → return input unchanged; if selection → `[selectedText](url)`; no selection → `[link text](url)`. Set new selection to encompass the full inserted link syntax.
- [x] T013 [P] [US4] Extend `src/components/docs-panel/formatting-toolbar.tsx` — add Link (Link icon) button after the third divider. When clicked, call `onAction('link')` — the parent handles the prompt and URL resolution.
- [x] T014 [US4] Update `handleToolbarAction` in `src/components/docs-panel/section-editor.tsx` — for `action === 'link'`: call `const url = window.prompt('Enter URL:') ?? ''`; if url is empty do nothing; otherwise prepend `https://` if url doesn't start with `http`; call `applyLink({ value, selectionStart, selectionEnd, url })` and apply result.

**Checkpoint**: P4 complete — all 13 toolbar actions functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, visual polish, and full test suite validation.

- [x] T015 Audit all toolbar buttons in `src/components/docs-panel/formatting-toolbar.tsx` — verify every button has: `type="button"`, unique `aria-label`, `title` matching aria-label, `tabIndex={0}`, `focus-visible:ring-2 focus-visible:ring-offset-1` Tailwind classes, and is reachable by Tab key in the editor
- [x] T016 Run `npm test` and confirm all existing 55 tests still pass with no regressions
- [x] T017 Run `npx tsc --noEmit` and confirm zero TypeScript errors across all modified/new files
- [x] T018 Follow all steps in `specs/008-content-styling-toolbar/quickstart.md` manually — verify all 4 user stories work end-to-end including save/reload persistence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types must exist for helpers)
- **US1 (Phase 3)**: Depends on Phase 2 (needs `wrapOrUnwrap` helper). T005 and T006 can run in parallel; T007 depends on both.
- **US2 (Phase 4)**: Depends on Phase 2 (needs `prefixLines` helper). T008 and T009 can run in parallel.
- **US3 (Phase 5)**: Depends on Phase 2 (needs `wrapAlignment` helper). T010 and T011 can run in parallel.
- **US4 (Phase 6)**: Depends on Phase 2 (needs function stub from T001). T012 and T013 can run in parallel; T014 depends on both.
- **Polish (Phase 7)**: Depends on all user stories complete.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — no other story dependency
- **US2 (P2)**: Depends on Foundational only — independent of US1
- **US3 (P3)**: Depends on Foundational only — independent of US1/US2
- **US4 (P4)**: Depends on Foundational only — independent of US1/US2/US3

All four user stories can be worked in parallel once Phase 2 is complete.

### Within Each User Story

- Logic implementation (`applyXxx` functions) and toolbar button additions can run in parallel
- Wiring into `section-editor.tsx` depends on both the logic and the toolbar component being ready

### Parallel Opportunities

- T005 and T006 (US1 logic + toolbar buttons) run in parallel
- T008 and T009 (US2 logic + toolbar buttons) run in parallel
- T010 and T011 (US3 logic + toolbar buttons) run in parallel
- T012 and T013 (US4 logic + toolbar button) run in parallel
- US2, US3, US4 can all start after Phase 2 completes, in parallel with US1

---

## Parallel Example: User Story 1

```bash
# These two can run simultaneously (different files):
Task T005: "Implement applyBold/applyItalic/applyUnderline in src/lib/editor/toolbar-actions.ts"
Task T006: "Create FormattingToolbar component with Bold/Italic/Underline buttons in src/components/docs-panel/formatting-toolbar.tsx"

# Then this runs after both complete (wires them together):
Task T007: "Wire toolbar into section-editor.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003, T004)
3. Complete Phase 3: US1 (T005, T006, T007)
4. **STOP and VALIDATE**: Bold/Italic/Underline work — toolbar is visible and functional
5. Users can immediately format text — core value delivered

### Incremental Delivery

1. Setup + Foundational → core helpers ready
2. US1 → Bold/Italic/Underline → **MVP**
3. US2 → Headings + Lists → structural formatting unlocked
4. US3 → Alignment → full layout control
5. US4 → Links → external references supported
6. Polish → production-ready

---

## Notes

- [P] = different files, no incomplete dependencies — safe to parallelize
- The `wrapOrUnwrap`, `prefixLines`, and `wrapAlignment` helpers (T002-T004) are the critical path — all 13 action implementations depend on them
- All `applyXxx` functions are pure (no DOM, no React) — straightforward to test manually in isolation
- `window.prompt()` for link URL is intentionally simple per spec — no popover needed
- `requestAnimationFrame` is required when restoring textarea selection after React state update
