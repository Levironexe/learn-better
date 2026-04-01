# Research: Content Styling Toolbar

**Feature**: 008-content-styling-toolbar
**Date**: 2026-04-01

## R1: Textarea Selection Manipulation

### Decision
Use the browser's native `textarea` selection API (`selectionStart`, `selectionEnd`, `setSelectionRange`) to read and modify selected text. After inserting formatted text, restore cursor position or selection using `requestAnimationFrame` to ensure the DOM has updated.

### Rationale
- The existing editor is a plain `<textarea>` — no contenteditable, no third-party rich-text library
- `selectionStart`/`selectionEnd` are universally supported and give character indices of the selection
- After programmatic value changes in React (via `setState`), the DOM textarea loses its selection; `setSelectionRange` called in a `useEffect` or `requestAnimationFrame` restores it
- This is the same pattern used by GitHub's markdown editor, Stack Overflow's editor, and most textarea-based editors

### Alternatives Considered
- **Replace textarea with contenteditable div**: Rejected — introduces significant complexity (sanitization, cursor management, paste handling), breaks existing controlled-input pattern
- **Use a rich text library (Tiptap, Slate, Quill)**: Rejected — would be a major dependency addition and architectural change; out of scope per spec
- **Use `document.execCommand`**: Deprecated and unreliable across browsers; rejected

## R2: Markdown Transform Functions Architecture

### Decision
Extract all 13 formatting transforms into a single pure utility module: `src/lib/editor/toolbar-actions.ts`. Each action is a pure function that takes `(value: string, selectionStart: number, selectionEnd: number)` and returns `{ newValue: string, newSelectionStart: number, newSelectionEnd: number }`.

### Rationale
- Pure functions are trivially unit-testable without DOM setup
- Separates formatting logic from React rendering concerns (clean architecture)
- The return type with new selection positions enables accurate cursor restoration after transformation
- Consistent function signature makes it easy to add new actions in the future

### Transform Behavior by Type

**Inline wrapping (Bold, Italic, Underline)**:
- With selection: wrap selected text in markers (`**text**`, `*text*`, `<u>text</u>`)
- Without selection: insert placeholder at cursor (`**bold text**`)
- Toggle: if selected text is already wrapped in the exact markers, unwrap it

**Block prefixing (H1/H2/H3, UL, OL)**:
- Find the start of the current line(s) in the selection
- Prefix each line with the appropriate marker (`# `, `## `, `### `, `- `, `1. `)
- Toggle: if the line already starts with the prefix, remove it
- Multi-line: apply to each line in the selection independently

**Alignment (Left, Center, Right, Justify)**:
- Wrap the selected line(s) in `<div style="text-align: [direction]">...\n</div>`
- Toggle: if already wrapped in the same alignment div, remove the wrapper
- Left alignment = remove any alignment wrapper (left is the default)

**Link**:
- With selection: convert to `[selected text](url)` — URL comes from a prompt/inline input
- Without selection: insert `[link text](url)` placeholder
- No toggle (links are not toggled off; user edits the markdown directly)

### Alternatives Considered
- **Inline logic in the component**: Rejected — makes the component hard to test and violates separation of concerns
- **Class-based action objects**: Overkill for 13 simple transforms; plain functions are sufficient

## R3: Link URL Input UX

### Decision
Use the browser's native `window.prompt()` for URL input. When the user clicks the Link button, prompt fires synchronously, and if a URL is entered, the formatted link is inserted.

### Rationale
- Simplest possible implementation with zero additional UI components
- Synchronous — doesn't require managing an open/close modal state
- Spec allows this; the user story doesn't require an inline tooltip or popover

### Alternatives Considered
- **Inline popover/tooltip input**: Better UX but requires a floating UI library or custom positioning logic — out of scope complexity
- **Dedicated modal dialog**: Same concern — adds state management and UI complexity not warranted for this feature phase

## R4: Toolbar Icon Library

### Decision
Use `lucide-react` (already installed at `^0.577.0`) for all toolbar icons. Map each action to the closest semantic Lucide icon:

| Action | Icon |
|--------|------|
| Bold | `Bold` |
| Italic | `Italic` |
| Underline | `Underline` |
| H1 | `Heading1` |
| H2 | `Heading2` |
| H3 | `Heading3` |
| Unordered List | `List` |
| Ordered List | `ListOrdered` |
| Align Left | `AlignLeft` |
| Align Center | `AlignCenter` |
| Align Right | `AlignRight` |
| Align Justify | `AlignJustify` |
| Link | `Link` |

### Rationale
- Zero new dependencies — `lucide-react` is already in `package.json`
- All required icons exist in the current version (`^0.577.0`)
- Consistent icon style with existing UI (Pencil, Trash2 icons in `section-editor.tsx` already use lucide-react)

## R5: Toolbar Layout & Accessibility

### Decision
Render the toolbar as a horizontal strip of icon buttons inside the editor header, above the textarea. Each button has:
- `aria-label` describing the action (e.g., `"Bold"`, `"Align center"`)
- `title` attribute for hover tooltips
- `type="button"` to prevent form submission
- Visible focus ring for keyboard navigation (Tailwind `focus-visible:ring-2`)
- Dividers between logical groups (inline / block / alignment / link)

### Rationale
- Constitution requires keyboard accessibility for all user-facing surfaces
- `aria-label` on icon-only buttons is required for screen reader compatibility
- Grouping with dividers improves visual scanning (consistent with most rich text editors)
