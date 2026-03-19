# Research: Section Content Editing

**Branch**: `004-section-edit` | **Date**: 2026-03-19

## Decision 1: Backend API — Reuse vs New

**Decision**: Reuse existing PATCH and DELETE endpoints at
`/api/lesson-plans/[id]/sections/[sectionId]`.

**Rationale**: Both endpoints are fully implemented with ownership verification,
Zod validation, structured error logging, and unique-constraint handling.
PATCH already accepts `content_markdown` via `SectionPatchSchema`. No new backend
work is needed for this feature.

**Alternatives considered**: A dedicated PATCH endpoint for only `content_markdown`
— unnecessary given the existing endpoint already supports partial updates.

---

## Decision 2: Section UUID vs Slug in Frontend

**Decision**: Extend the `Section` type with an optional `dbId?: string` field
to carry the real database UUID alongside the slug-based `id`.

**Rationale**: The `Section` type currently maps `id` to `slug` (used for anchor
navigation and active-section tracking). The API routes require the actual UUID.
Adding `dbId` is the least-invasive change: it does not break existing usage of
`id` (slug) and cleanly threads the UUID only where needed (the editor).

**How it flows**:
- `page.tsx` `handleSelectPlan` populates `section.dbId = s.id` (UUID from DB)
- AI-generated sections (streamed in-memory) do not have a `dbId` until after
  `persistSections()` writes them; editing is only available for persisted sections.
- The editor reads `section.dbId` to construct the API URL.

**Alternatives considered**:
- Store a `Map<slug, uuid>` in `page.tsx` state — more indirection, harder to pass down.
- Lookup by slug on save — requires an extra API call or a new endpoint.

---

## Decision 3: Live Preview Strategy

**Decision**: Split-pane inline editor — textarea on the left, `ReactMarkdown`
preview on the right — rendered directly inside `DocsContent` when in edit mode.

**Rationale**: `ReactMarkdown` + `remark-gfm` are already installed and used in
`DocsContent`. Reusing them gives zero additional dependencies and consistent
rendering between preview and read mode.

**Alternatives considered**:
- CodeMirror or Monaco for the textarea — adds significant bundle weight for no
  additional value in this context.
- Single-pane toggle (edit → preview) — real-time preview is an explicit requirement.

---

## Decision 4: Delete Confirmation

**Decision**: Use the browser's native `window.confirm()` dialog for delete
confirmation.

**Rationale**: Minimal implementation, zero additional UI state or components,
and meets the requirement of "explicit user confirmation before deletion."
The app can upgrade to a modal dialog in a future polish pass.

**Alternatives considered**: Custom modal component — over-engineered for this
scope; no design system is in place yet.

---

## Decision 5: State Update After Save/Delete

**Decision**: After a successful save, update `activePlan` in `page.tsx` by
replacing the edited section in-place (optimistic: update on success, not before).
After delete, remove the section from `activePlan.sections` and switch active
section to the first remaining section (or null if none).

**Rationale**: `activePlan` is the single source of truth for the rendered lesson
view. Mutating it in `page.tsx` after a confirmed API response keeps the UI
consistent without a full page reload.

**Alternatives considered**: Re-fetching the full plan from API after each change —
adds latency and unnecessary network traffic.

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Production Quality | ✅ | Error handling on save/delete; user shown error message on failure; stays in edit mode on error |
| Scalability by Design | ✅ | No in-process state beyond React state; all mutations go through authenticated API |
| Industry Best Practices | ✅ | Auth enforced server-side; input validated via SectionPatchSchema; no client-side trust |

No violations. No complexity debt to track.
