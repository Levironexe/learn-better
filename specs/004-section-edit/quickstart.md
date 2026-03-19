# Quickstart: Section Content Editing

**Branch**: `004-section-edit` | **Date**: 2026-03-19

## Happy Path — Edit and Save

1. Load a lesson plan that has at least one persisted section (loaded from DB).
2. In the docs panel, the active section shows **Edit** and **Delete** buttons.
3. Click **Edit** → text area appears with current `content_markdown`; right pane shows live markdown preview.
4. Modify the text → preview updates in real time.
5. Click **Save** → button disables, request sent to `PATCH /api/lesson-plans/{planId}/sections/{sectionId}`.
6. On success → view returns to read mode, rendered content reflects the saved changes.

## Happy Path — Delete

1. Load a lesson plan with multiple persisted sections.
2. Click **Delete** on a section → browser confirm dialog: "Delete this section? This cannot be undone."
3. Confirm → request sent to `DELETE /api/lesson-plans/{planId}/sections/{sectionId}`.
4. On success → section disappears from sidebar and content area; adjacent section becomes active.

## Edge Cases to Verify

- **Cancel edit**: changes discarded, original content restored, no API call made.
- **Save fails** (simulate 500): error message shown, user stays in edit mode with edits intact.
- **Delete the only section**: plan view shows empty state.
- **AI-streamed section** (not yet persisted): Edit/Delete buttons must NOT appear — `dbId` is absent.
- **Network offline during save**: same as save failure — error shown, edit mode preserved.
