# Quickstart: MCP Fix & Streaming Status Indicators

**Feature**: 007-mcp-fix-streaming-status
**Date**: 2026-03-21

## Prerequisites

- Node.js 20+
- `BRAVE_API_KEY` environment variable set in `.env.local`
- PostgreSQL (Supabase) connection configured via `DATABASE_URL`
- Project dependencies installed (`npm install`)

## Setup

1. **Verify Brave API key**:
   ```bash
   # Check .env.local has the key
   grep BRAVE_API_KEY .env.local
   ```

2. **Test MCP server availability**:
   ```bash
   # Verify the MCP server package can be fetched
   npx -y @modelcontextprotocol/server-brave-search --help
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Verification

### MCP Web Search Fix

1. Open the app at `http://localhost:3000`
2. Send a message like "Create a lesson about the latest developments in AI safety"
3. Verify in the terminal logs that MCP connection is established and search is performed
4. The generated lesson should include current/recent information

### Status Indicators

1. Send any lesson creation request
2. Observe the chat panel — you should see status messages appear:
   - "Understanding your request..." (during intent classification)
   - "Searching the web..." (during web search, if applicable)
   - "Generating lesson..." (during lesson plan generation)
3. Each indicator should disappear when its step completes
4. The final conversational text should appear normally after all indicators resolve

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/ai/mcp.ts` | MCP client creation and tool conversion |
| `src/lib/ai/tool-status.ts` | Tool name → label mapping (NEW) |
| `src/app/api/chat/route.ts` | Chat API — emits status data parts |
| `src/components/chat-panel/chat-messages.tsx` | Renders status indicators from data parts |
| `src/components/chat-panel/status-indicator.tsx` | Status indicator UI component (NEW) |
| `src/types/ai.ts` | TypeScript types for data parts |

## Running Tests

```bash
# Unit tests (tool status mapping)
npx vitest run tests/unit/tool-status.test.ts

# Component tests (status indicator rendering)
npx vitest run tests/integration/status-indicator.test.ts
```
