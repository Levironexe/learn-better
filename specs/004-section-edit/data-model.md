# Data Model: Section Content Editing

**Branch**: `004-section-edit` | **Date**: 2026-03-19

## Existing Entities (unchanged)

### lesson_sections

The primary entity being edited. No schema changes required.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | Used as API route parameter |
| lesson_plan_id | uuid FK | Ownership chain for auth |
| title | text | Section display name |
| slug | text | URL-safe identifier (unique per plan) |
| content_markdown | text | **The field being edited** |
| display_order | integer | Sort order |
| created_at | timestamptz | — |
| updated_at | timestamptz | Updated on PATCH |

### lesson_items

Cascade-deleted when parent `lesson_section` is deleted. No changes.

---

## Frontend Type Extension

The `Section` type in `src/lib/ai/index.ts` gains an optional field:

```
Section {
  id: string          // slug — used for anchor navigation (existing)
  title: string
  subsections: Subsection[]
  dbId?: string       // NEW: actual UUID from lesson_sections.id
                      // present only for DB-persisted sections
                      // absent for in-flight AI-streamed sections
}
```

**Why optional**: AI-generated sections streamed into memory have no DB UUID
until `persistSections()` completes. The Edit/Delete controls are only shown
when `section.dbId` is present.

---

## State Changes in page.tsx

| State | Change |
|-------|--------|
| `activePlan` | After save: replace section's `subsections` with re-parsed content. After delete: filter section out of `sections` array. |
| No new state added | Edit mode is local to `SectionEditor` component |
