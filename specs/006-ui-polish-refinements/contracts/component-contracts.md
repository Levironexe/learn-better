# Component Contracts: UI Polish & Refinements

**Feature**: 006-ui-polish-refinements
**Date**: 2026-03-19

## New Components

### ResizablePanels

Split-panel container with drag-to-resize and collapse functionality.

```typescript
interface ResizablePanelsProps {
  /** Content for the left (primary) panel */
  leftPanel: React.ReactNode
  /** Content for the right (secondary) panel */
  rightPanel: React.ReactNode
  /** Default right panel width as percentage (15-75). Default: 40 */
  defaultRightWidth?: number
  /** Minimum right panel width as percentage. Default: 15 */
  minRightWidth?: number
  /** Maximum right panel width as percentage. Default: 75 */
  maxRightWidth?: number
  /** localStorage key prefix for persistence. Default: 'learn-better' */
  storageKey?: string
}
```

**Behavior**:
- Renders two flex children separated by a draggable divider
- Divider: 4px wide, expands to visible handle on hover (`col-resize` cursor)
- Collapse toggle button on the divider (chevron icon)
- Persists width and collapse state to localStorage
- Applies `user-select: none` to body during drag

### Skeleton

Reusable loading placeholder component.

```typescript
interface SkeletonProps {
  /** Width of the skeleton. Default: '100%' */
  className?: string
}
```

**Variants** (composed from base Skeleton):
- `SidebarSkeleton`: Mimics sidebar nav items (5-7 short bars with varying widths)
- `ContentSkeleton`: Mimics section content (title bar + 3-4 paragraph blocks + subsection bars)

### useResizablePanels Hook

```typescript
interface UseResizablePanelsOptions {
  defaultWidth?: number     // Default right panel width %. Default: 40
  minWidth?: number         // Min right panel width %. Default: 15
  maxWidth?: number         // Max right panel width %. Default: 75
  storageKey?: string       // localStorage key prefix. Default: 'learn-better'
}

interface UseResizablePanelsReturn {
  rightWidth: number        // Current right panel width as percentage
  isCollapsed: boolean      // Whether right panel is collapsed
  isDragging: boolean       // Whether user is currently dragging
  toggleCollapse: () => void
  handleDragStart: (e: React.PointerEvent) => void
}
```

## Modified Component Contracts

### ChatInput (updated)

**Before**: Textarea and Send button as adjacent flex siblings.
**After**: Container div wrapping textarea + circular send button inside.

```typescript
// Props unchanged — internal layout restructured
interface ChatInputProps {
  input: string
  isLoading: boolean
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
}
```

**Visual contract**:
- Container: visible border, rounded-xl, padding, flex items-end
- Textarea: borderless, transparent background, auto-grow (1-5 rows)
- Send button: 32x32px circle, `bg-foreground text-background`, ArrowUp icon, disabled when empty/loading (opacity-30)

### DocsContent (updated)

**Before**: Edit and Delete text buttons per section.
**After**: Edit (Pencil), Copy (Clipboard), Delete (Trash) icon buttons per section.

```typescript
// New callback added to existing props
interface SectionHeaderProps {
  // ... existing props
  onCopy: (sectionMarkdown: string) => void  // NEW: triggered on copy icon click
}
```

**Icon button contract**:
- Size: 28x28px touchable area, 16x16px icon
- Spacing: gap-1 between icons
- Hover: `bg-muted` background on hover
- Copy feedback: icon changes to `Check` for 2s after successful copy
- Accessibility: `aria-label` on each button ("Edit section", "Copy section", "Delete section")

### DocsPanel / DocsSidebar (updated)

**Before**: Text-based loading indicator ("Generating lesson plan..." with pulse).
**After**: Skeleton placeholders matching content layout.

**Loading contract**:
- When `isLoading && !lessonPlan`: show `ContentSkeleton` in content area, `SidebarSkeleton` in sidebar
- When `isLoading && lessonPlan`: keep existing content visible (no skeleton replacement during streaming updates)
- Skeleton-to-content transition: no layout shift (skeletons match approximate content dimensions)

### SignOutButton (updated)

**Before**: Text-only link styling (`text-xs text-muted-foreground hover:text-foreground`).
**After**: Button-like styling matching ThemeToggle (`p-2 rounded-md hover:bg-muted transition-colors`).

## Global Style Contract

### Border Radius

All interactive bordered elements use `rounded-xl` (12px):
- Buttons (except circular avatar and send button)
- Text inputs / textareas
- Cards / bordered containers
- Chat message bubbles
- Modal overlays / panels
- Proposal banner
- Lesson plan tabs

**Exceptions** (keep existing radius):
- Avatar: stays `rounded-full` (circle)
- Send button: stays `rounded-full` (circle)
- Drag handle: stays thin/square (functional, not decorative)

### Prose Typography

Enhanced `prose` styles in `globals.css`:
- h2: `1.375rem`, `font-weight: 700`, `margin-top: 1.75rem`, `margin-bottom: 0.75rem`
- h3: `1.125rem`, `font-weight: 600`, `margin-top: 1.5rem`, `margin-bottom: 0.5rem`
- h4: `1rem`, `font-weight: 600`, `margin-top: 1.25rem`, `margin-bottom: 0.5rem`
- p: `margin-bottom: 0.75rem`, `line-height: 1.7`
- ul/ol: `padding-left: 1.5rem`, `margin-bottom: 0.75rem`, visible bullets/numbers
- li: `margin-bottom: 0.25rem`
- code (inline): `bg-muted`, `px-1.5 py-0.5`, `rounded`, `text-[0.875em]`
- pre: `bg-muted`, `p-4`, `rounded-xl`, `overflow-x: auto`
- blockquote: `border-left: 3px`, `pl-4`, `bg-muted/30`, `italic`
