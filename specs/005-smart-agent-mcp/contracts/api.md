# API Contracts: Smart Agent Behavior and MCP Integration

**Branch**: `005-smart-agent-mcp` | **Date**: 2026-03-19

---

## Modified: POST /api/chat

The existing chat endpoint is modified. The request shape is unchanged; the
response stream now conditionally emits a proposal part instead of always
emitting a lesson plan update.

**Request** (unchanged)
```json
{
  "messages": [...],
  "lessonPlanId": "uuid | null"
}
```

**Response stream — conversational intent** (no lesson plan emitted)
```
text-delta parts only (standard stream)
```

**Response stream — lesson intent**
```
data-lesson-plan-proposal part:
{
  "type": "data-lesson-plan-proposal",
  "data": {
    "proposalId": "nanoid",
    "title": "string",
    "content": { "sections": [...] },
    "mode": "create" | "edit",
    "lessonPlanId": "uuid?"
  }
}
followed by text-delta parts (conversational preview)
```

**Note**: `data-lesson-plan-update` is NO LONGER emitted by the chat route.
It is now only emitted by the accept-proposal route.

---

## New: POST /api/lesson-plans/accept-proposal

Persists a previously proposed lesson plan. Called by the frontend when the
user clicks Accept. Requires authenticated session.

**Request**
```json
{
  "title": "string",
  "content": {
    "sections": [
      {
        "id": "slug",
        "title": "string",
        "subsections": [
          { "id": "anchor", "title": "string", "body": "markdown" }
        ]
      }
    ]
  },
  "lessonPlanId": "uuid | null"
}
```

**Response 200**
```json
{
  "lessonPlanId": "uuid",
  "title": "string"
}
```

**Response 400** — missing or invalid fields

**Response 401** — not authenticated

**Response 500** — internal error

---

## New: POST /api/lesson-plans/decline-proposal

Records that the user declined a proposal. Saves the assistant's decline
acknowledgment to `chat_messages`. Requires authenticated session.

**Request**
```json
{
  "proposalId": "string",
  "lessonPlanId": "uuid | null"
}
```

**Response 204** — no content

---

## Frontend UI Contract: ProposalBanner Component

Rendered inline in the chat panel when `pendingProposal` is non-null.

```
Props:
  proposal: ProposalState
  onAccept: () => Promise<void>   — calls accept-proposal API, updates activePlan
  onDecline: () => void           — calls decline-proposal API, clears proposal

States:
  idle      — shows "Create this lesson plan?" (or "Apply these edits?") + Accept/Decline
  accepting — Accept button shows loading spinner, Decline disabled
  error     — shows error message, both buttons re-enabled
```

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BRAVE_API_KEY` | Optional | Enables web search via Brave MCP. If absent, search is silently skipped. |
