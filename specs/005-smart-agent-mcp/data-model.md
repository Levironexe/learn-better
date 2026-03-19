# Data Model: Smart Agent Behavior and MCP Integration

**Branch**: `005-smart-agent-mcp` | **Date**: 2026-03-19

## Existing Entities (unchanged)

`lesson_plans`, `lesson_sections`, `lesson_items`, `chat_messages` — no schema changes.

---

## New Frontend Data Parts

These extend the existing `LessonPlanDataParts` type union in `src/types/ai.ts`.

### `data-lesson-plan-proposal`

Sent by the chat route when the agent determines a lesson plan should be created or
updated. Contains the full generated content but is NOT persisted. The frontend
holds this in state until the user accepts or declines.

```ts
{
  type: 'data-lesson-plan-proposal'
  data: {
    proposalId: string          // client-side UUID (nanoid)
    title: string
    content: LessonPlanContent  // full sections + subsections
    mode: 'create' | 'edit'     // used for UI labeling
    lessonPlanId?: string        // present when mode = 'edit'
  }
}
```

---

## New Runtime Types

### `Intent`

```ts
type Intent = 'conversational' | 'create_lesson' | 'edit_lesson'
```

### `IntentClassification` (internal, backend only)

```ts
{
  intent: Intent
  rationale: string  // LLM's reasoning, used for logging/debugging
}
```

### `ProposalState` (frontend state)

```ts
{
  proposalId: string
  title: string
  content: LessonPlanContent
  mode: 'create' | 'edit'
  lessonPlanId?: string
} | null
```

---

## State Changes in `page.tsx`

| State | Change |
|-------|--------|
| `pendingProposal` | NEW: holds `ProposalState`. Set when `data-lesson-plan-proposal` received. Cleared on accept or decline. |
| `activePlan` | Updated after accept (set to accepted plan content). Unchanged during proposal phase. |
| `activePlanId` | Updated after accept (set to returned `lessonPlanId`). |

---

## New REST Endpoint State

`POST /api/lesson-plans/accept-proposal` is stateless — it receives the full
proposal content and writes it to the DB. Returns `{ lessonPlanId, title }`.
No new DB tables or columns required.
