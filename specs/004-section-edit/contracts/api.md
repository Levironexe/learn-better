# API Contracts: Section Content Editing

**Branch**: `004-section-edit` | **Date**: 2026-03-19

> Both endpoints already exist. No new routes required.

---

## PATCH /api/lesson-plans/[id]/sections/[sectionId]

Updates a section's content. Requires authenticated session (owner only).

**Request**
```json
{ "content_markdown": "## Updated content\n\nBody text here." }
```

**Response 200**
```json
{ "section": { "id": "uuid", "content_markdown": "...", "updated_at": "..." } }
```

**Response 400** — validation error
```json
{ "error": "validation_error", "details": { ... } }
```

**Response 401** — not authenticated

**Response 404** — plan or section not found / not owned by user

**Response 500** — internal error

---

## DELETE /api/lesson-plans/[id]/sections/[sectionId]

Deletes a section and all its child items (cascade). Requires authenticated session (owner only).

**Response 204** — deleted, no body

**Response 401** — not authenticated

**Response 404** — plan or section not found / not owned by user

---

## UI Contract: SectionEditor Component

```
Props:
  planId: string           — lesson plan UUID (for API URL)
  sectionId: string        — section UUID (dbId)
  initialContent: string   — current content_markdown value
  onSave: (newContent: string) => void   — called after successful save
  onDelete: () => void                   — called after successful delete
  onCancel: () => void                   — called when user cancels edit

States:
  idle      — shows Edit + Delete buttons
  editing   — shows textarea + live preview + Save + Cancel buttons
  saving    — Save button disabled, shows loading indicator
  deleting  — Delete button disabled
  error     — shows error message, stays in editing state
```
