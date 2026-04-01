# Quickstart: Content Styling Toolbar

**Feature**: 008-content-styling-toolbar
**Date**: 2026-04-01

## Prerequisites

- Node.js 20+
- Project running locally (`npm run dev`)
- An existing lesson plan with at least one section (to test the editor)

## Manual Verification

### Access the Editor

1. Open the app at `http://localhost:3000`
2. Create or load a lesson plan
3. Click the pencil (edit) icon on any section — the full-screen editor opens

### Verify the Toolbar Appears

- The toolbar should be visible as a horizontal strip of icon buttons above the textarea
- Buttons should be grouped: `[B I U]` | `[H1 H2 H3]` | `[list bullets list numbers]` | `[align-left align-center align-right align-justify]` | `[link]`

### Test Inline Formatting (P1)

1. Type some text in the textarea
2. Select a word
3. Click **Bold** → the word should be wrapped in `**word**`; preview shows bold text
4. With the same word still selected (now including `**`), click **Bold** again → markers removed (toggle)
5. Repeat for **Italic** (`*word*`) and **Underline** (`<u>word</u>`)
6. Click Bold with nothing selected → `**bold text**` inserted at cursor

### Test Block Formatting (P2)

1. Place cursor on an empty line
2. Click **H1** → `# ` prefixed to the line; preview shows a heading
3. Click **H1** again → prefix removed (toggle)
4. Click **Bullet List** → `- ` prefixed; preview shows a bullet point
5. Select 3 lines, click **Numbered List** → each line gets `1. ` prefix

### Test Alignment (P3)

1. Place cursor on a line with text
2. Click **Center** → text wrapped in `<div style="text-align: center">...</div>`; preview shows centered text
3. Click **Left** → wrapper removed; text returns to left-aligned
4. Click **Right** → `<div style="text-align: right">...</div>` wrapper; preview shows right-aligned

### Test Link Insertion (P4)

1. Select the word "example"
2. Click the **Link** button → a prompt appears asking for a URL
3. Enter `https://example.com` → selection becomes `[example](https://example.com)`; preview shows a clickable link
4. Cancel the prompt → no change in editor

### Verify Persistence

1. Apply some formatting
2. Click **Save**
3. Close the editor
4. Re-open the same section → formatted content is preserved exactly

## Running Tests

```bash
# Unit tests for all toolbar transforms
npx vitest run tests/unit/toolbar-actions.test.ts

# Integration tests for toolbar rendering
npx vitest run tests/integration/formatting-toolbar.test.ts

# Full test suite
npm test
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/editor/toolbar-actions.ts` | Pure formatting transform functions (13 actions) |
| `src/components/docs-panel/formatting-toolbar.tsx` | Toolbar UI component |
| `src/components/docs-panel/section-editor.tsx` | Modified to include toolbar |
| `tests/unit/toolbar-actions.test.ts` | Unit tests for all transforms |
| `tests/integration/formatting-toolbar.test.ts` | Toolbar rendering tests |
