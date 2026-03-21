# learn-better Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-21

## Active Technologies
- TypeScript 5.9 + Node.js 20+ + Next.js 16.1.7, Drizzle ORM 0.45.1, drizzle-kit 0.31.10, (003-hierarchical-lesson-schema)
- PostgreSQL via Supabase (pooled connection uses `DATABASE_URL`; (003-hierarchical-lesson-schema)
- TypeScript 5.9 / Node.js 20+ + Next.js 16.1.7 (App Router), React 19, Drizzle ORM 0.45.1, `react-markdown`, `remark-gfm` (004-section-edit)
- PostgreSQL via Supabase (pooled). No schema changes. (004-section-edit)
- TypeScript 5.9 / Node.js 20+ + Next.js 16.1.7 (App Router), `ai` v6, `@ai-sdk/anthropic` v3, Zod v4, Drizzle ORM 0.45.1 (005-smart-agent-mcp)
- `@modelcontextprotocol/sdk` — MCP client for Brave Search web integration (005-smart-agent-mcp)
- PostgreSQL via Supabase. No schema changes. (005-smart-agent-mcp)
- TypeScript 5.9 / Node.js 20+ + Next.js 16.1.7, React 19.2.3, Tailwind CSS v4 (CSS-first config), `react-markdown` 10.1.0, `remark-gfm` 4.0.1, `ai` v6, `@ai-sdk/react` v3, `next-themes` 0.4.6 (006-ui-polish-refinements)
- PostgreSQL via Supabase (no schema changes — UI-only feature). `localStorage` for panel width persistence. (006-ui-polish-refinements)
- TypeScript 5.9 / Node.js 20+ + Next.js 16.1.7 (App Router), `ai` v6, `@ai-sdk/react` v3, `@ai-sdk/anthropic` v3, `@modelcontextprotocol/sdk` v1.27.1, React 19.2.3, Zod v4, `lucide-react` (007-mcp-fix-streaming-status)
- PostgreSQL via Supabase (no schema changes for this feature) (007-mcp-fix-streaming-status)

- TypeScript 5.x, Node.js 20+ + Next.js 15, `@supabase/ssr` ^0.5, `ai` v4, `@ai-sdk/anthropic`, (001-ai-learning-platform)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 20+: Follow standard conventions

## Recent Changes
- 007-mcp-fix-streaming-status: Added TypeScript 5.9 / Node.js 20+ + Next.js 16.1.7 (App Router), `ai` v6, `@ai-sdk/react` v3, `@ai-sdk/anthropic` v3, `@modelcontextprotocol/sdk` v1.27.1, React 19.2.3, Zod v4, `lucide-react`
- 006-ui-polish-refinements: Added TypeScript 5.9 / Node.js 20+ + Next.js 16.1.7, React 19.2.3, Tailwind CSS v4 (CSS-first config), `react-markdown` 10.1.0, `remark-gfm` 4.0.1, `ai` v6, `@ai-sdk/react` v3, `next-themes` 0.4.6
- 005-smart-agent-mcp: Added TypeScript 5.9 / Node.js 20+ + Next.js 16.1.7 (App Router), `ai` v6, `@ai-sdk/anthropic` v3, Zod v4, Drizzle ORM 0.45.1


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
