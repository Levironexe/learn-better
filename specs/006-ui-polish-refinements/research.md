# Research: UI Polish & Refinements

**Feature**: 006-ui-polish-refinements
**Date**: 2026-03-19

## R-001: Icon Library Selection

**Decision**: Use `lucide-react` for all icons (pencil, clipboard, trash, arrow-up, chevrons for panel toggle).

**Rationale**: Lucide is the most widely adopted React icon library in the Next.js ecosystem. It provides tree-shakeable imports (only bundles icons you use), consistent 24x24 SVG grid, TypeScript support out of the box, and customizable size/stroke props. The existing codebase uses inline SVGs in `theme-toggle.tsx` — lucide-react replaces this pattern with a consistent API.

**Alternatives considered**:
- `@heroicons/react`: Good but fewer icons, Tailwind-aligned but not as rich for generic UI actions
- `react-icons`: Bundles multiple icon sets but larger bundle size, inconsistent APIs across sets
- Continue with inline SVGs: Would work but creates maintenance burden as icon usage grows

---

## R-002: Resizable Panel Implementation Approach

**Decision**: Custom `useResizablePanels` hook using pointer events (pointerdown/pointermove/pointerup) for drag handling, CSS flexbox for layout, and localStorage for persistence.

**Rationale**: A custom hook keeps the implementation lightweight with zero additional dependencies. The resize behavior is straightforward: track pointer position during drag, compute panel widths as percentages, enforce min/max constraints, and persist to localStorage. CSS flexbox handles the actual layout, ensuring the two panels always sum to 100% width. Pointer events (not mouse events) provide unified touch + mouse support.

**Alternatives considered**:
- `react-resizable-panels` (npm): Full-featured library but adds ~15KB gzipped dependency for a feature we can implement in ~80 lines. Overkill for a two-panel split.
- CSS `resize` property: Only works on individual elements, doesn't support drag-to-resize between two adjacent panels.
- `@radix-ui/react-resizable`: Not yet a stable Radix primitive.

**Key implementation details**:
- Use `flex-basis` with percentage values for panel sizing
- Store width as percentage (e.g., `60`) in localStorage key `learn-better:panel-width`
- Minimum widths: 25% for content panel, 15% for chat panel (responsive to viewport)
- Collapse state stored separately: `learn-better:chat-collapsed` boolean
- Drag handle: 4px wide hitzone, expands to 8px on hover, cursor `col-resize`
- During drag: apply `user-select: none` and `cursor: col-resize` to body to prevent text selection

---

## R-003: Markdown Content Rendering Improvements

**Decision**: Enhance existing `prose` CSS styles in `globals.css` and improve the `react-markdown` component configuration in `docs-content.tsx`.

**Rationale**: The current prose styles exist but are insufficient — the screenshots show content rendering as a "wall of text" with poor heading hierarchy, missing list styling, and inadequate spacing. The fix involves:
1. **CSS improvements**: Better heading size differentiation (h2: 1.375rem, h3: 1.125rem, h4: 1rem), increased paragraph margins, proper list indentation with visible bullets/numbers, blockquote styling with left border and background
2. **react-markdown configuration**: Already using `remark-gfm` which handles tables, strikethrough, etc. May need to add custom component overrides for better heading anchors and list rendering

**Alternatives considered**:
- Switch to `@tailwindcss/typography` plugin: Tailwind v4 doesn't have a stable v4-compatible typography plugin yet; custom prose styles in globals.css is the recommended approach
- Use a different markdown renderer (e.g., `mdx`): Overkill for display-only content rendering
- Use custom React components for each markdown element: Already partially done via react-markdown's components prop; extend as needed

---

## R-004: Skeleton Loading Pattern

**Decision**: Create a reusable `Skeleton` component using CSS animation (`animate-pulse` with Tailwind) that mirrors the expected content layout.

**Rationale**: Skeleton screens reduce perceived load time by showing placeholder shapes that match the incoming content layout. The implementation uses simple `div` elements with `rounded` corners, `bg-muted` background, and Tailwind's `animate-pulse`. Different skeleton variants map to different content types: sidebar nav items, section headers, paragraph blocks.

**Alternatives considered**:
- `react-loading-skeleton` library: Adds dependency for something achievable with ~20 lines of Tailwind
- Spinner/loading text (current approach): Inferior UX — doesn't communicate layout structure
- Suspense boundaries with React 19: Could work for server components but the current data fetching is client-side via useEffect + fetch

---

## R-005: Chat Input Redesign

**Decision**: Restructure the chat input as a container `div` with the `textarea` and a circular send button positioned inside using flexbox alignment.

**Rationale**: The current layout has the textarea and send button as separate siblings in a flex row. The redesign nests the send button inside the input container, creating a modern chat input pattern (similar to ChatGPT, Claude, iMessage). The container gets a visible border/background, the textarea becomes borderless, and the send button is a 32x32 circle with `ArrowUp` icon from lucide-react, positioned at bottom-right of the container.

**Key implementation details**:
- Container: `border border-border bg-background rounded-xl p-2 flex items-end gap-2`
- Textarea: `border-0 bg-transparent focus:ring-0 resize-none flex-1`
- Send button: `w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shrink-0` — disabled state uses `opacity-30`
- Auto-grow textarea: maintain `rows={1}` with `max-h-[120px]` and auto-resize via scrollHeight

---

## R-006: Clipboard API Usage

**Decision**: Use `navigator.clipboard.writeText()` with async/await and try-catch error handling. Show success feedback via temporary icon state change (clipboard → check icon for 2 seconds).

**Rationale**: The Clipboard API is supported in all modern browsers (Chrome 66+, Firefox 63+, Safari 13.1+, Edge 79+). It's the standard approach replacing the deprecated `document.execCommand('copy')`. The async API integrates naturally with React state for feedback UI.

**Alternatives considered**:
- `document.execCommand('copy')`: Deprecated, requires creating a temporary textarea element, synchronous
- Third-party clipboard library (`clipboard.js`, `copy-to-clipboard`): Unnecessary abstraction over a simple browser API

---

## R-007: Border Radius Strategy

**Decision**: Apply `rounded-xl` (0.75rem / 12px) globally to all interactive bordered elements by updating component classes directly. No CSS variable abstraction needed.

**Rationale**: The user explicitly requested `rounded-xl`. Since this is a Tailwind utility class, it's applied directly in component JSX. The affected elements are: buttons, text inputs, cards/containers with borders, chat message bubbles, modal elements, proposal banner. A global CSS override is less maintainable than explicit per-component classes because it would require complex selectors and could affect third-party components unintentionally.

**Alternatives considered**:
- CSS custom property `--radius` with global override: More "DRY" but harder to debug, and some elements may need different radii (e.g., avatar stays circular, pills stay fully rounded)
- Tailwind theme extension: Tailwind v4 CSS-first config makes this possible but unnecessary for a single utility class change
