# Data Model: MCP Fix & Streaming Status Indicators

**Feature**: 007-mcp-fix-streaming-status
**Date**: 2026-03-21

## Overview

No database schema changes are required. This feature introduces two new TypeScript types for the streaming data part system and a status label mapping.

## New Types

### ToolStatusDataPart

Extends the existing `LessonPlanDataParts` type in `src/types/ai.ts`.

| Field | Type | Description |
|-------|------|-------------|
| `tool` | `string` | Internal tool identifier (e.g., `brave_web_search`, `generate_lesson`) |
| `status` | `'running' \| 'complete'` | Current lifecycle state of the tool call |
| `label` | `string` | Human-readable status label (e.g., "Searching the web") |

**Lifecycle**: A `running` event is emitted when a tool call begins. A `complete` event is emitted when the call finishes (success or failure). The frontend uses the latest status per tool name to determine visibility.

### ToolStatusLabels

Static mapping in `src/lib/ai/tool-status.ts`.

| Tool Name | Label |
|-----------|-------|
| `brave_web_search` | Searching the web |
| `generate_lesson` | Generating lesson |
| `classify_intent` | Understanding your request |
| *(fallback)* | Processing ({toolName}) |

## Existing Types (modified)

### LessonPlanDataParts (extended)

The `LessonPlanDataParts` type union in `src/types/ai.ts` gains a new member:

```
'tool-status': { tool: string; status: 'running' | 'complete'; label: string }
```

This preserves backward compatibility — existing `lesson-plan-update` and `lesson-plan-proposal` parts are unchanged.

### AppUIMessage

No changes — already parameterized on `LessonPlanDataParts`, so the new `tool-status` part is automatically available in message parts.

## Entity Relationships

```
UIMessageStream
  └── DataPart[]
        ├── data-lesson-plan-proposal  (existing)
        ├── data-lesson-plan-update    (existing)
        └── data-tool-status           (NEW)
              ├── tool: string
              ├── status: running | complete
              └── label: string
```

## State Transitions

```
Tool Call Lifecycle:
  [idle] → writer.write({ type: 'data-tool-status', data: { status: 'running' } })
         → [running - indicator visible in UI]
         → writer.write({ type: 'data-tool-status', data: { status: 'complete' } })
         → [complete - indicator hidden/collapsed]
```

## Validation Rules

- `tool` must be a non-empty string
- `status` must be exactly `'running'` or `'complete'`
- `label` must be a non-empty string (generated from the mapping, with fallback)
- Every `running` event should eventually be followed by a `complete` event for the same tool name
