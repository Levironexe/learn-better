# Research: MCP Fix & Streaming Status Indicators

**Feature**: 007-mcp-fix-streaming-status
**Date**: 2026-03-21

## R1: MCP Brave Search Tool — Diagnosis

### Decision
The MCP integration code in `src/lib/ai/mcp.ts` is structurally sound. The `createBraveSearchTools()` function:
- Correctly checks for `BRAVE_API_KEY` env var
- Spawns the MCP server via `npx -y @modelcontextprotocol/server-brave-search`
- Converts MCP tools to AI SDK `tool()` format
- Handles cleanup via caller's `finally` block

The most likely failure points are:
1. **Missing `BRAVE_API_KEY`** — function returns `null` silently, no web search happens
2. **`npx` subprocess failure** — the `StdioClientTransport` spawn may fail if `npx` is not on PATH in the server environment, or if the package download fails
3. **Hardcoded input schema** — the code forces `z.object({ query: z.string() })` for all MCP tools, but Brave Search server exposes a `brave_web_search` tool whose actual schema may have additional optional fields. This could cause schema validation failures.
4. **Silent error swallowing** — the `catch(() => null)` on line 98 of `route.ts` swallows all MCP errors, making diagnosis impossible without explicit logging

### Rationale
Root-cause diagnosis requires adding structured logging to the MCP connection lifecycle. The fix approach is:
- Add `console.error` logging to `createBraveSearchTools()` for connection failures
- Use the MCP tool's own `inputSchema` instead of hardcoding the Zod schema (the AI SDK `zodSchema()` already accepts raw JSON Schema)
- Verify `BRAVE_API_KEY` is set in `.env.local`
- Test with a real query end-to-end

### Alternatives Considered
- **Replace MCP with direct Brave API calls**: Rejected — MCP is the intended architecture and already mostly works. The issue is configuration/schema, not architectural.
- **Switch to a different search provider**: Out of scope — the spec says fix the existing tool, not replace it.

## R2: Streaming Status Indicators — AI SDK Data Parts

### Decision
Use the existing `createUIMessageStream` data part mechanism to stream status events. The AI SDK already supports custom typed data parts (used for `data-lesson-plan-proposal`). We'll add a new `tool-status` data part type.

**Backend**: The chat route will emit `data-tool-status` parts via `writer.write()` at the start and end of each processing phase:
- Before MCP search: `{ type: 'data-tool-status', data: { tool: 'brave_web_search', status: 'running' } }`
- After MCP search: `{ type: 'data-tool-status', data: { tool: 'brave_web_search', status: 'complete' } }`
- Before lesson generation: `{ type: 'data-tool-status', data: { tool: 'generate_lesson', status: 'running' } }`
- After lesson generation: `{ type: 'data-tool-status', data: { tool: 'generate_lesson', status: 'complete' } }`

**Frontend**: The `ChatMessages` component will check for `data-tool-status` parts in messages and render a `StatusIndicator` component for any with `status: 'running'`. Completed statuses cause the indicator to collapse/hide.

### Rationale
This approach:
- Reuses the existing typed data part system (no new streaming mechanism)
- Status events are part of the message stream, so they're naturally tied to the assistant message lifecycle
- The `useChat` hook from `@ai-sdk/react` already surfaces data parts in `message.parts`
- No additional state management needed — the parts array is the source of truth

### Alternatives Considered
- **Server-Sent Events (SSE) side channel**: Rejected — adds complexity; the main stream already supports data parts.
- **React state + polling**: Rejected — adds latency and client-side complexity.
- **`streamText` metadata/annotations**: Rejected — annotations are less structured than typed data parts and harder to type-check.

## R3: Tool Status Label Mapping

### Decision
Create a simple mapping module `src/lib/ai/tool-status.ts` that maps internal tool identifiers to user-facing labels:

```typescript
const TOOL_STATUS_LABELS: Record<string, string> = {
  brave_web_search: 'Searching the web',
  generate_lesson: 'Generating lesson',
  classify_intent: 'Understanding your request',
}

export function getToolStatusLabel(toolName: string): string {
  return TOOL_STATUS_LABELS[toolName] ?? `Processing (${toolName})`
}
```

### Rationale
- Simple, flat mapping — no over-engineering
- Fallback for unknown tools ensures extensibility without breaking
- Labels are user-friendly present-progressive phrases matching the spec examples
- Centralized in one file for easy updates when new tools are added

### Alternatives Considered
- **Labels embedded in tool definitions**: Rejected — MCP tools don't have a "label" field, and mixing display concerns into tool definitions violates separation of concerns.
- **i18n system**: Overkill for a single-locale app with ~5 labels.

## R4: Status Indicator UI Component

### Decision
Create a lightweight `StatusIndicator` component that renders an animated dot + label text. Uses Tailwind CSS v4 for styling and `lucide-react` for an optional spinner icon (already a project dependency).

The component renders inline within the message flow (not as a floating overlay) to match the conversational UX pattern used by ChatGPT and Claude. It appears as a subtle left-aligned element below the last assistant message text part.

### Rationale
- Inline rendering keeps the indicator contextual (associated with the message being generated)
- Animation provides visual feedback that work is happening
- Collapsing on completion avoids visual clutter in the chat history

### Alternatives Considered
- **Floating toast/notification**: Rejected — disconnected from the message context, feels like a system notification rather than agent activity.
- **Progress bar**: Rejected — we don't have progress percentages for tool calls, just start/end events.
