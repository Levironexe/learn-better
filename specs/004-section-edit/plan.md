# Implementation Plan: Section Content Editing

**Branch**: `004-section-edit` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)

## Summary

Allow authenticated users to edit `lesson_sections.content_markdown` inline with
live markdown preview, and delete sections with confirmation. The backend PATCH
and DELETE endpoints already exist and are fully auth-guarded. This feature is
entirely frontend work plus a minimal type extension.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js 20+
**Primary Dependencies**: Next.js 16.1.7 (App Router), React 19, Drizzle ORM 0.45.1, `react-markdown`, `remark-gfm`
**Storage**: PostgreSQL via Supabase (pooled). No schema changes.
**Testing**: Vitest (unit), Playwright (integration)
**Target Platform**: Web (desktop-first)
**Project Type**: Web application
**Performance Goals**: Live preview updates < 100ms after keystroke
**Constraints**: Edit/Delete only available when `section.dbId` is present (persisted sections only)
**Scale/Scope**: Per-user lesson plans; single editor at a time

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Auth on data-modifying surface | ✅ | Server-side ownership check exists in PATCH/DELETE routes |
| Input validation | ✅ | `SectionPatchSchema` (Zod) validates all PATCH inputs |
| Error handling & user feedback | ✅ | Save errors keep edit mode intact + show message |
| No unindexed queries | ✅ | All queries use primary keys or indexed FK columns |
| Meaningful test coverage | ✅ required | Unit test for SectionEditor state machine; integration test for save/delete flows |

## Project Structure

### Documentation (this feature)

```text
specs/004-section-edit/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md
```

### Source Code

```text
src/
├── lib/
│   └── ai/
│       └── index.ts              # extend Section type with dbId?: string
├── components/
│   └── docs-panel/
│       ├── docs-panel.tsx        # pass planId + onSectionSave + onSectionDelete
│       ├── docs-content.tsx      # wire SectionEditor; pass dbId + planId
│       └── section-editor.tsx    # NEW: edit/save/cancel/delete + live preview
└── app/
    └── (protected)/
        └── page.tsx              # populate dbId in handleSelectPlan; handle save/delete state updates
```

**No new API routes.** PATCH and DELETE at
`/api/lesson-plans/[id]/sections/[sectionId]` are already complete.

## Implementation Notes

### Type Extension (`src/lib/ai/index.ts`)

Add `dbId?: string` to `SectionSchema`:
```ts
export const SectionSchema = z.object({
  id: z.string(),       // slug (existing — used for anchors)
  dbId: z.string().optional(),  // NEW: real UUID for API calls
  title: z.string(),
  subsections: z.array(SubsectionSchema),
})
```

### Data Flow for `dbId`

In `page.tsx` → `handleSelectPlan`:
```ts
sections: lessonPlan.sections.map((s) => ({
  id: s.slug,
  dbId: s.id,   // <-- populate UUID
  title: s.title,
  subsections: s.items.map(...)
}))
```

AI-streamed sections do NOT get a `dbId` — edit controls are hidden via
`{section.dbId && <SectionEditor ... />}`.

### SectionEditor Component

- **Props**: `planId`, `sectionId` (dbId), `initialContent`, `onSave`, `onDelete`, `onCancel`
- **Modes**: `idle` | `editing` | `saving` | `error`
- **Edit mode layout**: two-column — `<textarea>` left, `<ReactMarkdown>` right
- **Delete**: `window.confirm()` → `DELETE` fetch → call `onDelete()`
- **Save**: `PATCH` fetch with `{ content_markdown }` → on success call `onSave(newContent)`
- **Error**: show inline error string, remain in `editing` mode

### State Updates in `page.tsx`

**After save** — replace subsections by re-parsing saved markdown into display items:
The content panel re-renders with the new `content_markdown` value. Since subsections
are stored in `lesson_items`, a save of `content_markdown` does NOT update them —
the live view should re-render from the updated `content_markdown` directly in
`DocsContent` rather than via `subsections`. This means `DocsContent` needs to
render from `content_markdown` when available, falling back to `subsections`.

**After delete** — filter section from `activePlan.sections`, set active section to
`sections[0]` or `null`.

## Complexity Tracking

| Concern | Why Accepted | Mitigation |
|---------|-------------|------------|
| `content_markdown` and `subsections` can diverge after edit | Editing `content_markdown` doesn't update `lesson_items` rows | Future task: re-parse markdown into items on save, or drop items and render from markdown only |
| `window.confirm()` for delete | Minimal scope; no design system yet | Upgrade to modal in polish phase |
