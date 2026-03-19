# Research: Smart Agent Behavior and MCP Integration

**Branch**: `005-smart-agent-mcp` | **Date**: 2026-03-19

## Decision 1: Intent Detection Strategy

**Decision**: Two-step approach — run `generateObject` first with an `IntentSchema`
to classify the user's message, then branch on the result.

**Rationale**: More reliable than a single-pass approach because intent classification
is isolated and independently testable. The classifier can be fine-tuned (via system
prompt or schema) without touching the generation logic. Tool-calling was considered
but requires the model to both classify and generate in one pass, making testing harder.

**IntentSchema**:
```ts
z.object({
  intent: z.enum(['conversational', 'create_lesson', 'edit_lesson']),
  rationale: z.string(), // for debugging
})
```

**Alternatives considered**:
- Tool-calling (model decides to call `generateLessonPlan` or not) — cleaner but
  harder to test and less predictable for simple greetings.
- Single-pass structured output `{ intent, reply, lessonPlan? }` — avoids a round
  trip but couples generation with classification, harder to stream.

---

## Decision 2: Confirmation Flow

**Decision**: Backend generates the lesson plan proposal but does NOT persist it.
It sends a new data part `data-lesson-plan-proposal` to the frontend. The frontend
shows Accept/Decline inline in the chat. On Accept, the frontend directly calls
`POST /api/lesson-plans` (or `PATCH` for edits) to persist. On Decline, nothing is
saved and the agent sends a brief acknowledgment.

**Rationale**: Cleanly separates generation from persistence. The persistence API
routes already exist and are auth-guarded. No new round-trip through the chat route
is needed on confirmation — the frontend calls REST directly.

**Confirmation flow diagram**:
```
user message → chat route
  → intent = create_lesson
  → generateObject(LessonPlanContentSchema)
  → write data-lesson-plan-proposal (no persist)
  → stream conversational preview text
frontend: shows "Create this plan?" Accept/Decline
  Accept → POST /api/lesson-plans + sections
  Decline → nothing saved, no follow-up needed
```

**New data part type**:
```ts
'data-lesson-plan-proposal': {
  proposalId: string   // client-side uuid, used to match accept/decline
  title: string
  content: LessonPlanContent
}
```

**Alternatives considered**:
- Send confirm message back through chat and let backend persist — extra round-trip,
  logic duplicated in chat route.
- Store proposal in DB with status "pending" — unnecessary complexity for a single
  user session.

---

## Decision 3: Edit Existing Plan Flow

**Decision**: When intent is `edit_lesson` and `lessonPlanId` is present, fetch the
current sections from the DB and inject them into the generation prompt as context.
The generator then produces a full updated `LessonPlanContent`. Send as
`data-lesson-plan-proposal` (same as create).

**Prompt injection format**:
```
Current lesson plan sections:
<sections>
[Section 1 title]: [content_markdown]
[Section 2 title]: [content_markdown]
...
</sections>
User's edit request: [user message]
Please update the lesson plan according to the request above.
```

**Rationale**: Feeding the full current plan to the model (not just the edited section)
lets the model maintain coherence across sections. The proposal flow is identical to
creation, so no new UI is needed.

**Alternatives considered**:
- Per-section patching (send only the affected section) — requires the model to
  correctly identify which section to change; error-prone for multi-section edits.

---

## Decision 4: Web Search MCP

**Decision**: Use `@modelcontextprotocol/server-brave-search` via the
`@modelcontextprotocol/sdk` client (stdio transport). Tools returned by the MCP
server are adapted to AI SDK-compatible tools and injected into the lesson generation
`generateObject` call when the user's topic likely benefits from current data.

**New dependencies**:
- `@modelcontextprotocol/sdk` — MCP client + stdio transport
- `@modelcontextprotocol/server-brave-search` — web search server (requires
  `BRAVE_API_KEY` env var)

**The `ai` v6 package does NOT include a built-in MCP client** — `@modelcontextprotocol/sdk`
must be used directly.

**MCP client lifecycle**: Create per-request (not singleton) in the Next.js route
handler. Stdio transport spawns a child process per request — acceptable for low
traffic. Must call `client.close()` in a `finally` block to avoid zombie processes.

**Web search activation heuristic**: Only attach MCP tools when intent is
`create_lesson` or `edit_lesson` AND `BRAVE_API_KEY` is configured. If the API key
is absent, search is silently skipped.

**Alternatives considered**:
- `@modelcontextprotocol/server-fetch` (no API key) — only fetches specific URLs;
  not useful for search.
- Exa MCP — requires paid API key; less widely known.
- Singleton MCP client — not safe in serverless/edge environments and not compatible
  with stdio transport lifecycle.

---

## Decision 5: Chat Route Architecture

**Decision**: Refactor `src/app/api/chat/route.ts` into three clearly separated
phases:
1. **Intent detection**: `generateObject` with `IntentSchema`
2. **Action execution** (only for lesson intents): generate proposal, optionally
   with MCP tools; stream `data-lesson-plan-proposal`
3. **Conversational reply**: `streamText` for the human-readable response

For `conversational` intent, skip phases 2 entirely and jump straight to phase 3.

**New REST endpoint**: `POST /api/lesson-plans/accept-proposal` — accepts
`{ title, content, lessonPlanId? }`, persists the plan + sections, returns
`{ lessonPlanId, title }`. This keeps persistence out of the chat route.

**Alternatives considered**: Keeping persistence in the chat route behind a flag —
creates a branching mess and is harder to test independently.

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Production Quality | ✅ | Strict intent gate, error handling on each phase, MCP errors are non-fatal |
| Scalability by Design | ✅ | MCP client created/closed per request; no in-process state; new REST endpoint is idempotent |
| Industry Best Practices | ✅ | Auth on all routes; input validation on proposal accept; MCP API key is env-var gated |
| Testing | ✅ required | Intent classifier is unit-testable in isolation; acceptance flow testable without MCP |

No violations. Known debt: MCP stdio transport creates one child process per request —
acceptable now, should be revisited if traffic grows.
