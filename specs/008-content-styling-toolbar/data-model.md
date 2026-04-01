# Data Model: Content Styling Toolbar

**Feature**: 008-content-styling-toolbar
**Date**: 2026-04-01

## Overview

No database schema changes. All formatted content is stored in the existing `content_markdown` field on `lesson_sections` as plain text (markdown syntax + HTML inline markup for underline and alignment). The formatting is transparent to the storage layer.

## New Types (TypeScript only)

### ToolbarAction

Represents a single formatting operation that the toolbar can perform.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (e.g., `'bold'`, `'h1'`, `'align-center'`) |
| `label` | `string` | Human-readable name for aria-label and tooltip |
| `icon` | `LucideIcon` | Lucide icon component to render |
| `type` | `'inline' \| 'block' \| 'alignment' \| 'link'` | Category of formatting action |

### TransformResult

Return type of every toolbar action transform function.

| Field | Type | Description |
|-------|------|-------------|
| `newValue` | `string` | Full updated textarea content after transform |
| `newSelectionStart` | `number` | Cursor/selection start to restore after React re-render |
| `newSelectionEnd` | `number` | Cursor/selection end to restore after React re-render |

### TransformInput

Input to every toolbar action transform function.

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string` | Full current textarea content |
| `selectionStart` | `number` | Current selection start index |
| `selectionEnd` | `number` | Current selection end index |

## Markdown Format Reference

The following table documents exactly how each toolbar action is stored:

| Action | Markdown/HTML Stored | Toggle Detection |
|--------|---------------------|-----------------|
| Bold | `**text**` | Starts and ends with `**` |
| Italic | `*text*` | Starts and ends with `*` (not `**`) |
| Underline | `<u>text</u>` | Starts with `<u>` and ends with `</u>` |
| H1 | `# line` | Line starts with `# ` |
| H2 | `## line` | Line starts with `## ` |
| H3 | `### line` | Line starts with `### ` |
| Unordered List | `- line` | Line starts with `- ` |
| Ordered List | `1. line` | Line starts with `\d+\. ` |
| Align Left | *(no wrapper — default)* | Remove any alignment div |
| Align Center | `<div style="text-align: center">line\n</div>` | Wrapped in center div |
| Align Right | `<div style="text-align: right">line\n</div>` | Wrapped in right div |
| Align Justify | `<div style="text-align: justify">line\n</div>` | Wrapped in justify div |
| Link | `[text](url)` | N/A — no toggle |

## Placeholders (no selection)

| Action | Inserted Placeholder |
|--------|---------------------|
| Bold | `**bold text**` |
| Italic | `*italic text*` |
| Underline | `<u>underline text</u>` |
| Link | `[link text](url)` |
| Block actions | Apply to current line (no selection needed) |

## Storage

- **Table**: `lesson_sections`
- **Column**: `content_markdown` (existing, `text` type)
- **No migration required**: All new markup is valid text content for the existing column
