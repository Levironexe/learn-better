# Erudex

An LLM-powered learning platform where you chat with an AI assistant to generate structured lesson plans on any topic. Built as a side project to explore AI-assisted education and experiment with [Spec Kit](https://github.com/spec-kit/specify) as a development workflow.

<img width="1895" height="916" alt="image" src="https://github.com/user-attachments/assets/3617a388-18f0-4beb-9a5a-b91d3f55f1da" />

## What it does

- **Chat to learn** — Ask the AI to teach you any subject. It generates structured, multi-section lesson plans with proper headings, subsections, and markdown formatting.
- **Browse content** — Navigate lesson plans through a sidebar with collapsible sections. Content is rendered with clean typography.
- **Edit sections** — Open a split-pane markdown editor to tweak any section. Changes persist to the database.
- **Copy content** — One-click copy of any section's markdown for use in your own notes.
- **Resizable layout** — Drag to resize the content and chat panels. Collapse the chat panel when you want to focus on reading.
- **Web search** — The AI agent uses MCP (Model Context Protocol) to search the web via Brave Search for up-to-date information.

## Tech stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript 5.9
- **AI**: Anthropic Claude via Vercel AI SDK v6, MCP for tool use
- **Database**: PostgreSQL on Supabase, Drizzle ORM
- **Auth**: Supabase Auth with SSR
- **Testing**: Vitest, Playwright

## Getting started

```bash
# Clone and install
git clone https://github.com/Levironexe/learn-better.git
cd learn-better
pnpm install

# Set up environment
cp .env.local.example .env.local
# Fill in your Supabase and Anthropic API keys

# Run database migrations
pnpm drizzle-kit push

# Start dev server
pnpm dev
```

## About

**THIS IS A FOR-FUN PROJECT** — not production software. The entire thing was designed and implemented using [Spec Kit](https://github.com/spec-kit/specify), an AI-powered specification-driven development workflow. Each feature went through the full cycle: `/speckit.specify` -> `/speckit.plan` -> `/speckit.tasks` -> `/speckit.implement`. You can find all the specs, plans, and task breakdowns in the `specs/` directory.

Here is an overview of Spec Kit usage in my project:
<img width="800" height="429" alt="image" src="https://github.com/user-attachments/assets/be457369-4432-4144-9188-d77cf6b0855a" />

## License

MIT
