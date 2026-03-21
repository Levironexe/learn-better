# Implementation Plan: MCP Fix & Streaming Status Indicators

**Branch**: `007-mcp-fix-streaming-status` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-mcp-fix-streaming-status/spec.md`

## Summary

Fix the broken Brave Search MCP tool integration so the agent can perform web searches during lesson creation, and add real-time streaming status indicators to the chat UI so users see what the agent is doing (e.g., "Searching the web...", "Generating lesson...") during multi-step operations. The MCP fix is config/connectivity scoped — no tool logic changes. Status indicators use the existing AI SDK `createUIMessageStream` data part mechanism to stream status events from backend to frontend.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js 20+
**Primary Dependencies**: Next.js 16.1.7 (App Router), `ai` v6, `@ai-sdk/react` v3, `@ai-sdk/anthropic` v3, `@modelcontextprotocol/sdk` v1.27.1, React 19.2.3, Zod v4, `lucide-react`
**Storage**: PostgreSQL via Supabase (no schema changes for this feature)
**Testing**: Vitest (unit), Playwright (integration/e2e)
**Target Platform**: Web (server-side Next.js API routes + client-side React SPA)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Status indicators appear/disappear within 500ms of tool call start/end
**Constraints**: No changes to existing tool logic; status messages must not interfere with existing data part streaming (`data-lesson-plan-proposal`)
**Scale/Scope**: Single chat API route, 1 new UI component, 1 new data part type, MCP config diagnosis

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Production Quality** | PASS | Error handling for MCP already exists (graceful null return); status indicators will have proper lifecycle management. Structured logging for MCP connection failures will be added. |
| **II. Scalability by Design** | PASS | Status indicator system uses a generic tool-name-to-label mapping — extensible without UI changes. MCP client lifecycle already handles cleanup via finally blocks. No in-process state concerns. |
| **III. Industry Best Practices** | PASS | Separation of concerns maintained: status data parts are a new type in the existing typed system. Unit tests for tool status mapping and integration test for MCP connectivity required. Auth unchanged (existing middleware). |
| **Dev Scope: Testing** | PASS | Unit tests for status label mapping; integration test for MCP tool creation; component test for status indicator rendering. |
| **Dev Scope: Observability** | PASS | `console.error` already used for MCP failures; will add structured logging for connection lifecycle events. |

## Project Structure

### Documentation (this feature)

```text
specs/007-mcp-fix-streaming-status/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts          # Modified: emit status data parts during processing
├── components/
│   └── chat-panel/
│       ├── chat-messages.tsx      # Modified: render status indicator parts
│       └── status-indicator.tsx   # NEW: reusable status indicator component
├── lib/
│   └── ai/
│       ├── mcp.ts                 # Modified: diagnostic logging, fix if config issue found
│       └── tool-status.ts         # NEW: tool name → human-readable label mapping
└── types/
    └── ai.ts                      # Modified: add ToolStatusDataParts type

tests/
├── unit/
│   └── tool-status.test.ts        # NEW: unit tests for label mapping
└── integration/
    └── status-indicator.test.ts   # NEW: component rendering tests
```

**Structure Decision**: Follows the existing Next.js App Router structure. Two new files (`status-indicator.tsx`, `tool-status.ts`) are minimal additions. The `contracts/` directory holds the streaming data part contract since the chat API is an internal interface.

## Complexity Tracking

> **Fill for any Constitution Check violations that must be tracked as known technical debt**

| Concern | Why Accepted | Mitigation / Remediation Plan |
|---------|-------------|-------------------------------|
| MCP subprocess spawned per request | Existing pattern from prior implementation; connection pooling adds complexity beyond scope | Track MCP connection pool as future optimization if latency becomes an issue |
| No e2e Playwright test for MCP web search | Requires live Brave API key in CI; cannot be reliably tested in automated pipeline | Manual verification with test query; mock-based integration test covers the flow |
