# Implementation Plan: Smart Agent Behavior and MCP Integration

**Branch**: `005-smart-agent-mcp` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)

## Summary

Refactor the AI chat agent to: (1) detect user intent before acting, (2) only
generate lesson plans when intent is educational, (3) require explicit user
confirmation before persisting any content, (4) support targeted editing of
existing plans, and (5) optionally fetch live web data via Brave Search MCP.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js 20+
**Primary Dependencies**: Next.js 16.1.7 (App Router), `ai` v6, `@ai-sdk/anthropic` v3, Zod v4, Drizzle ORM 0.45.1
**New Dependencies**:
  - `@modelcontextprotocol/sdk` — MCP client + StdioClientTransport
  - `@modelcontextprotocol/server-brave-search` — web search MCP server (run via npx)
**Storage**: PostgreSQL via Supabase. No schema changes.
**Testing**: Vitest (unit), Playwright (integration)
**Target Platform**: Web (server-side Next.js API routes)
**Performance Goals**: Intent detection adds less than 300ms to chat response time
**Constraints**: MCP stdio transport spawned per-request; must be closed in finally block
**Scale/Scope**: Single-user session; no concurrency concerns for MCP lifecycle

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Auth on new routes | PASS | accept-proposal and decline-proposal routes require Supabase session |
| Input validation | PASS | Proposal content validated via LessonPlanContentSchema on accept |
| Error handling | PASS | MCP errors are non-fatal; proposal accept errors shown in UI |
| No unindexed queries | PASS | All DB queries on PKs |
| Tests required | PASS | Intent classifier unit tests; proposal flow integration tests required |

## Project Structure

### Documentation (this feature)

```text
specs/005-smart-agent-mcp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md
```

### Source Code

```text
src/
├── lib/
│   └── ai/
│       ├── index.ts              # add IntentSchema, INTENT_SYSTEM_PROMPT
│       └── mcp.ts                # NEW: createBraveSearchTools() helper
├── app/
│   └── api/
│       ├── chat/
│       │   └── route.ts          # REFACTOR: intent detection + proposal flow
│       └── lesson-plans/
│           ├── accept-proposal/
│           │   └── route.ts      # NEW: POST — persist accepted proposal
│           └── decline-proposal/
│               └── route.ts      # NEW: POST — log decline
└── components/
    └── chat-panel/
        ├── chat-panel.tsx        # pass pendingProposal + handlers down
        └── proposal-banner.tsx   # NEW: Accept/Decline inline UI
src/
└── app/
    └── (protected)/
        └── page.tsx              # pendingProposal state, handleAccept, handleDecline
src/
└── types/
    └── ai.ts                     # add data-lesson-plan-proposal data part type
```

## Implementation Notes

### Intent Detection (`src/lib/ai/index.ts`)

New Zod schema and system prompt:
```ts
export const IntentSchema = z.object({
  intent: z.enum(['conversational', 'create_lesson', 'edit_lesson']),
  rationale: z.string(),
})
export type IntentClassification = z.infer<typeof IntentSchema>

export const INTENT_SYSTEM_PROMPT = `You are an intent classifier for a lesson planning app.
Classify the user's latest message as one of:
- conversational: greetings, thanks, questions not about learning a topic, small talk
- create_lesson: user wants to learn a new topic or create a lesson plan
- edit_lesson: user wants to modify, update, or add to an existing lesson plan
Respond with JSON only.`
```

### Chat Route Refactor (`src/app/api/chat/route.ts`)

Three-phase execution inside the stream execute function:

**Phase 1 — Intent detection**:
```ts
const { object: { intent } } = await generateObject({
  model: anthropic('claude-haiku-4-5'),
  schema: IntentSchema,
  system: INTENT_SYSTEM_PROMPT,
  messages: modelMessages,
})
```

**Phase 2 — Lesson generation (only for create_lesson / edit_lesson)**:
- Optionally attach MCP tools from `createBraveSearchTools()`
- If editing: fetch current sections from DB, build context prompt
- `generateObject(LessonPlanContentSchema)` with optional MCP tools
- Write `data-lesson-plan-proposal` to stream — **no persist**

**Phase 3 — Conversational reply**: always run `streamText` for the human reply.

Remove all `db.insert/update` calls from this route.

### MCP Helper (`src/lib/ai/mcp.ts`)

Uses `@modelcontextprotocol/sdk` Client + StdioClientTransport:
- Spawns `npx -y @modelcontextprotocol/server-brave-search` as child process
- Passes `BRAVE_API_KEY` from environment
- Returns adapted AI SDK-compatible tool definitions
- Caller must close the client in a `finally` block

Returns empty object `{}` if `BRAVE_API_KEY` is not set — no error.

### Accept Proposal Route (`src/app/api/lesson-plans/accept-proposal/route.ts`)

Extracted + validated persistence logic (currently in chat route):
- Auth check
- Validate `{ title, content: LessonPlanContentSchema, lessonPlanId? }`
- Upsert `lesson_plans`, delete existing sections (cascade), call `persistSections()`
- Return `{ lessonPlanId, title }`

### Proposal Banner (`src/components/chat-panel/proposal-banner.tsx`)

Client component, rendered in `ChatPanel` when `pendingProposal !== null`.
Shows mode-appropriate label ("Create this lesson plan?" vs "Apply these edits?").
States: `idle | accepting | error`.

### Frontend State (`page.tsx`)

New: `pendingProposal: ProposalState | null`

`handleAccept`: POST `/api/lesson-plans/accept-proposal` → on success, set `activePlan`, `activePlanId`, clear `pendingProposal`, emit `data-lesson-plan-update` locally.

`handleDecline`: POST `/api/lesson-plans/decline-proposal` → clear `pendingProposal`.

Message watcher: watch for `data-lesson-plan-proposal` parts (replaces current `data-lesson-plan-update` watcher from chat stream).

## Complexity Tracking

| Concern | Why Accepted | Mitigation |
|---------|-------------|------------|
| MCP stdio spawns child process per request | Low traffic; simplest correct approach | Switch to singleton keep-alive if req/s grows |
| Intent detection adds a round-trip LLM call | Required for correctness; uses cheap haiku model | Cache intent for identical messages if latency becomes an issue |
| data-lesson-plan-update removed from chat route | Breaking change to frontend watcher | Update watcher in same PR; no stale consumers |
