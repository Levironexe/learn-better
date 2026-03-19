# Data Model: UI Polish & Refinements

**Feature**: 006-ui-polish-refinements
**Date**: 2026-03-19

## Overview

This feature introduces **no database schema changes**. All new state is client-side only, stored in browser localStorage for session persistence.

## Client-Side State Entities

### PanelLayout

Represents the user's preferred panel configuration for the split-panel layout.

| Field | Type | Description |
|-------|------|-------------|
| chatWidth | number (15-75) | Chat panel width as percentage of viewport. Default: 40 |
| collapsed | boolean | Whether the chat panel is collapsed. Default: false |

**Storage**: `localStorage`
- Key `learn-better:panel-width` → number (percentage)
- Key `learn-better:chat-collapsed` → `"true"` | `"false"`

**Validation rules**:
- `chatWidth` must be between 15 and 75 (enforced by resize hook)
- Content panel width is derived: `100 - chatWidth`
- When collapsed, content panel occupies 100% width

**State transitions**:
- `expanded` → `collapsed`: Toggle click. Stores current width, sets content to 100%.
- `collapsed` → `expanded`: Toggle click. Restores stored width.
- `resizing`: Drag in progress. Updates width in real-time. Persists on drag end.

### CopyFeedback

Transient UI state for clipboard copy feedback. Not persisted.

| Field | Type | Description |
|-------|------|-------------|
| sectionId | string | ID of the section whose copy was triggered |
| status | `'idle'` \| `'copied'` | Current feedback state |
| timeout | number | Duration in ms before resetting to idle. Default: 2000 |

**State transitions**:
- `idle` → `copied`: User clicks copy icon. Clipboard write succeeds.
- `copied` → `idle`: After 2000ms timeout, icon reverts.
- `idle` (on error): Clipboard write fails. No state change; error logged.

## Existing Entities (unchanged)

The following entities from previous features remain unchanged:

- **LessonPlan**: No changes. Content fetched and displayed as before.
- **Section**: No changes. Markdown content accessed for copy functionality via existing `subsections[].body` field.
- **User/Auth**: No changes. Sign-out button styling only.
