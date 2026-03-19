# Quickstart: UI Polish & Refinements

**Feature**: 006-ui-polish-refinements
**Date**: 2026-03-19

## Prerequisites

- Node.js 20+
- pnpm (package manager)
- Running Supabase instance (for lesson plan data)

## Setup

```bash
# 1. Switch to the feature branch
git checkout 006-ui-polish-refinements

# 2. Install dependencies (adds lucide-react)
pnpm install

# 3. Copy environment variables (if not already done)
cp .env.local.example .env.local
# Fill in Supabase and Anthropic API keys

# 4. Start development server
pnpm dev
```

## New Dependency

```bash
# Added in this feature:
pnpm add lucide-react
```

## Key Files to Review

| File | What Changed |
|------|-------------|
| `src/components/ui/resizable-panels.tsx` | NEW: Split-panel layout with drag-to-resize |
| `src/components/ui/skeleton.tsx` | NEW: Reusable skeleton loading component |
| `src/hooks/use-resizable-panels.ts` | NEW: Resize/collapse logic hook |
| `src/lib/clipboard.ts` | NEW: Clipboard utility with error handling |
| `src/app/(protected)/page.tsx` | Updated: Uses ResizablePanels instead of fixed 60/40 split |
| `src/app/globals.css` | Updated: Enhanced prose styles, no new CSS variables |
| `src/components/chat-panel/chat-input.tsx` | Updated: Embedded send button with ArrowUp icon |
| `src/components/docs-panel/docs-content.tsx` | Updated: Icon buttons (edit/copy/delete) |
| `src/components/docs-panel/docs-panel.tsx` | Updated: Skeleton loading states |
| `src/components/sign-out-button.tsx` | Updated: Hover effect matching theme toggle |

## Testing

```bash
# Run all tests
pnpm test

# Run only this feature's tests
pnpm vitest run tests/unit/use-resizable-panels.test.ts
pnpm vitest run tests/unit/clipboard.test.ts

# Run with coverage
pnpm test -- --coverage
```

## Verification Checklist

1. **Panel resize**: Drag the divider between content and chat panels — both resize smoothly
2. **Panel collapse**: Click the collapse toggle — chat panel hides, content fills width
3. **Panel persist**: Resize, refresh the page — widths are restored
4. **Content rendering**: View a lesson section — headings, lists, code blocks have clear visual hierarchy
5. **Copy section**: Click the clipboard icon on a section — markdown copied to clipboard, icon shows checkmark
6. **Chat input**: Type a message — send button (arrow-up circle) is visible inside the input area
7. **Skeleton loading**: Select a lesson plan — skeleton placeholders appear before content loads
8. **Border radius**: Inspect buttons, inputs, cards — all show `rounded-xl`
9. **Sign-out hover**: Hover over "Sign out" — background highlight matches theme toggle
10. **Dark mode**: Toggle theme — all changes work correctly in both light and dark modes
