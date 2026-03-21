# Contract: Chat Stream Data Parts

**Feature**: 007-mcp-fix-streaming-status
**Scope**: Internal streaming contract between `POST /api/chat` and the React chat UI

## Overview

The chat API route streams responses using `createUIMessageStream`. Data parts are typed custom payloads embedded in the stream alongside text content. This contract documents the new `data-tool-status` part.

## Existing Data Parts (unchanged)

### `data-lesson-plan-proposal`

```json
{
  "type": "data-lesson-plan-proposal",
  "data": {
    "proposalId": "uuid",
    "title": "string",
    "content": { "sections": [...] },
    "mode": "create | edit",
    "lessonPlanId": "string (optional)"
  }
}
```

### `data-lesson-plan-update`

```json
{
  "type": "data-lesson-plan-update",
  "data": {
    "lessonPlanId": "string",
    "title": "string",
    "content": { "sections": [...] }
  }
}
```

## New Data Part

### `data-tool-status`

Emitted during agent processing to indicate tool call lifecycle events.

```json
{
  "type": "data-tool-status",
  "data": {
    "tool": "string",
    "status": "running | complete",
    "label": "string"
  }
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool` | `string` | Yes | Internal tool identifier (e.g., `brave_web_search`, `generate_lesson`) |
| `status` | `"running" \| "complete"` | Yes | Lifecycle state |
| `label` | `string` | Yes | Human-readable label for display (e.g., "Searching the web") |

**Emission Pattern**:

1. `{ status: "running" }` emitted immediately before the tool call begins
2. `{ status: "complete" }` emitted immediately after the tool call finishes (success or error)
3. Multiple tools may be running within a single message stream (emitted sequentially)

**Frontend Behavior**:

- Display a status indicator for each `running` part that has no subsequent `complete` part for the same `tool`
- Hide/collapse the indicator when the corresponding `complete` part arrives
- Status indicators render inline within the assistant message bubble area

## Ordering Guarantees

Data parts are emitted in chronological order within the stream. A `complete` event for a given tool always follows its `running` event. Text parts may be interleaved between status events.

## Backward Compatibility

The `data-tool-status` part is additive. Clients that do not recognize it will simply ignore it (standard behavior for unknown data part types in the AI SDK). No changes to existing `data-lesson-plan-proposal` or `data-lesson-plan-update` contracts.
