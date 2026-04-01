# Implementation Plan: Content Styling Toolbar

**Branch**: `008-content-styling-toolbar` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-content-styling-toolbar/spec.md`

## Summary

Add a formatting toolbar to the existing section editor (`SectionEditor` component) that lets users apply markdown-compatible styles — Bold, Italic, Underline, H1/H2/H3, Unordered List, Ordered List, Left/Center/Right/Justify alignment, and Link — via clickable buttons. The toolbar wraps the existing `<textarea>` without replacing it. Each action inserts or wraps markdown/HTML syntax around the current text selection (or inserts a placeholder when nothing is selected). All 13 actions include toggle behavior. Content is stored as-is in the existing `content_markdown` field — no schema changes needed.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js 20+
**Primary Dependencies**: Next.js 16.1.7 (App Router), React 19.2.3, Tailwind CSS v4, `lucide-react` ^0.577.0, `react-markdown` + `remark-gfm` (existing preview renderer)
**Storage**: PostgreSQL via Supabase — existing `content_markdown` field on `lesson_sections` table. No schema changes.
**Testing**: Vitest 3.x (unit), Playwright (e2e recommended for P1)
**Target Platform**: Web (desktop-first; mobile not a concern for editor)
**Project Type**: Web application (Next.js full-stack, feature is frontend-only)
**Performance Goals**: Toolbar actions apply within 16ms (single render frame); no perceptible lag on selections up to 10,000 characters
**Constraints**: No new npm dependencies — use `lucide-react` (already installed) for icons; all formatting stored as plain text (markdown/HTML), no binary or JSON blobs
**Scale/Scope**: Single component enhancement; affects `SectionEditor` only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Production Quality** | PASS | Toolbar actions are pure text transforms — no async operations, no network calls. Error surface is minimal. Visual quality gate: toolbar must be keyboard-accessible (tabIndex, aria-label on all buttons). |
| **II. Scalability by Design** | PASS | No state stored server-side; formatting is embedded in existing `content_markdown` field. No scale ceiling introduced. |
| **III. Industry Best Practices** | PASS | Separation of concerns: formatting logic extracted to a pure utility module (`toolbar-actions.ts`), component only handles rendering. Unit tests required for all 13 action transforms. Keyboard accessibility required. |
| **Dev Scope: Testing** | PASS | Unit tests for all formatting transforms (pure functions — straightforward to test). Integration test for toolbar rendering. |
| **Dev Scope: Auth/Security** | PASS | No new API surface. Existing auth on the PATCH endpoint covers content persistence. HTML tags (`<u>`, `<div>`) are rendered in a controlled preview via `react-markdown` — no XSS risk in preview; stored content is user-authored. |
| **Dev Scope: Observability** | PASS | No async operations to log. Toolbar actions are synchronous UI transforms. |

## Project Structure

### Documentation (this feature)

```text
specs/008-content-styling-toolbar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── docs-panel/
│       ├── section-editor.tsx          # Modified: add toolbar, wire up actions
│       └── formatting-toolbar.tsx      # NEW: toolbar UI component (13 buttons)
├── lib/
│   └── editor/
│       └── toolbar-actions.ts          # NEW: pure formatting transform functions

tests/
├── unit/
│   └── toolbar-actions.test.ts         # NEW: unit tests for all 13 transforms
└── integration/
    └── formatting-toolbar.test.ts      # NEW: toolbar rendering & interaction tests
```

**Structure Decision**: Frontend-only feature. New files are minimal and scoped: one pure-logic module, one UI component, two test files. No backend changes. Follows existing `src/components/docs-panel/` and `src/lib/` conventions.

## Complexity Tracking

| Concern | Why Accepted | Mitigation / Remediation Plan |
|---------|-------------|-------------------------------|
| Alignment uses `<div style="text-align:...">` HTML wrappers | Markdown has no native alignment syntax; HTML passthrough is the only markdown-compatible option | Document behavior clearly; revisit if a CSS-class-based alternative (e.g., custom remark plugin) becomes available |
| Underline uses `<u>text</u>` HTML | Not a standard markdown feature; `<u>` is the only portable markdown-compatible representation | Same as above — already documented in spec assumptions |
| No undo/redo beyond browser native | Implementing a full undo stack is out of scope; textarea's native Ctrl+Z covers the common case | Can be added later as a dedicated undo feature |
