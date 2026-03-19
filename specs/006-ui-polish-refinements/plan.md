# Implementation Plan: UI Polish & Refinements

**Branch**: `006-ui-polish-refinements` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ui-polish-refinements/spec.md`

## Summary

A collection of UI improvements to enhance the learn-better platform's visual quality and usability: collapsible/resizable split-panel layout with drag-to-resize, improved markdown content rendering with proper typography, section action icons (edit/copy/delete) with clipboard support, redesigned chat input with embedded send button, skeleton loading states for content fetching, global border-radius increase, and sign-out button hover consistency.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js 20+
**Primary Dependencies**: Next.js 16.1.7, React 19.2.3, Tailwind CSS v4 (CSS-first config), `react-markdown` 10.1.0, `remark-gfm` 4.0.1, `ai` v6, `@ai-sdk/react` v3, `next-themes` 0.4.6
**New Dependencies**: `lucide-react` (icon library — no icon library currently installed; inline SVGs used)
**Storage**: PostgreSQL via Supabase (no schema changes — UI-only feature). `localStorage` for panel width persistence.
**Testing**: Vitest 3.2.4, Playwright 1.58.2. Currently only unit tests for utility functions (`src/**/*.test.ts`). No component tests exist yet.
**Target Platform**: Web (modern browsers with Clipboard API and CSS resize/flexbox support)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Panel resize at 60fps (no layout thrash), skeleton-to-content transition < 300ms perceived, clipboard copy < 500ms with feedback
**Constraints**: No database schema changes. Must support both light and dark themes via existing CSS variable system. Tailwind v4 CSS-first configuration (no `tailwind.config.js`).
**Scale/Scope**: ~12 component files modified, 1 new dependency added, 2-3 new utility components created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Production Quality | PASS | Error handling for clipboard API failures, proper loading states, accessible icon buttons with aria-labels, dark/light theme support |
| II. Scalability by Design | PASS | Panel resize uses CSS flexbox (browser-native), no custom layout engine. localStorage for preferences is appropriate for client-only UI state. No server-side scaling concerns (UI-only feature) |
| III. Industry Best Practices | PASS | Component tests required for new interactive behaviors (resize, copy, collapse). Accessible markup (aria attributes on icon buttons). Separation of concerns: resize logic extracted to custom hook |

**Testing requirement**: Unit tests for resize hook logic and copy-to-clipboard utility. Integration tests for panel collapse/expand behavior. Visual regression coverage recommended via Playwright.

## Project Structure

### Documentation (this feature)

```text
specs/006-ui-polish-refinements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── component-contracts.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── globals.css                          # Updated: prose styles, border-radius tokens
│   └── (protected)/
│       └── page.tsx                         # Updated: resizable panel layout
├── components/
│   ├── navbar.tsx                           # Updated: sign-out button styling
│   ├── sign-out-button.tsx                  # Updated: hover effect
│   ├── lesson-plan-list.tsx                 # Updated: border-radius
│   ├── ui/
│   │   ├── skeleton.tsx                     # NEW: reusable skeleton component
│   │   └── resizable-panels.tsx             # NEW: resizable split-panel with drag handle
│   ├── chat-panel/
│   │   ├── chat-panel.tsx                   # Updated: collapsible wrapper
│   │   ├── chat-input.tsx                   # Updated: embedded send button design
│   │   └── chat-messages.tsx                # Updated: border-radius on bubbles
│   └── docs-panel/
│       ├── docs-panel.tsx                   # Updated: skeleton loading states
│       ├── docs-content.tsx                 # Updated: icon buttons, copy, prose improvements
│       ├── docs-sidebar.tsx                 # Updated: skeleton loading states
│       └── section-editor.tsx               # Updated: border-radius on modal elements
├── hooks/
│   └── use-resizable-panels.ts             # NEW: resize logic with drag, collapse, persist
└── lib/
    └── clipboard.ts                         # NEW: clipboard utility with error handling

tests/
├── unit/
│   ├── use-resizable-panels.test.ts        # NEW: resize hook tests
│   └── clipboard.test.ts                   # NEW: clipboard utility tests
└── integration/
    └── panel-layout.test.ts                # NEW: panel collapse/expand behavior
```

**Structure Decision**: Follows existing Next.js App Router layout. New reusable UI primitives go in `src/components/ui/`. New hooks in `src/hooks/`. New utilities in `src/lib/`. Tests mirror source structure under `tests/`.

## Complexity Tracking

| Concern | Why Accepted | Mitigation / Remediation Plan |
|---------|-------------|-------------------------------|
| No component test infrastructure yet | Vitest configured for `.test.ts` only; component tests would need jsdom/happy-dom setup | Add jsdom environment config for component tests in this feature; hook tests run in node env |
| localStorage for panel width | Not synced across devices | Acceptable for UI preference; upgrade to user preferences API if needed later |
| No Clipboard API fallback for older browsers | Modern browser target assumption | Document browser support requirements; add `document.execCommand('copy')` fallback if analytics show older browser usage |
