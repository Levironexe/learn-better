# Feature Specification: Content Styling Toolbar

**Feature Branch**: `008-content-styling-toolbar`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "Add content styling toolbar with markdown-compatible formatting: alignment, bold, italic, underline, unordered/ordered lists, links, headers. Excludes hard styling like colors and highlighting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply Inline Text Formatting (Priority: P1)

A user is editing a lesson section and wants to emphasize specific words or phrases. They select text in the editor and click a toolbar button (bold, italic, underline) to wrap the selection with the appropriate markdown syntax. The preview panel immediately reflects the styled result.

**Why this priority**: Inline text formatting (bold, italic, underline) is the most commonly used styling action and delivers immediate value with the simplest implementation. It is the foundation all other toolbar interactions build on.

**Independent Test**: Can be fully tested by opening the section editor, selecting text, clicking Bold/Italic/Underline buttons, and verifying the correct markdown syntax is inserted and the preview renders styled text.

**Acceptance Scenarios**:

1. **Given** the editor is open with text selected, **When** the user clicks Bold, **Then** the selected text is wrapped in `**...**` and the preview shows bold text.
2. **Given** the editor is open with text selected, **When** the user clicks Italic, **Then** the selected text is wrapped in `*...*` and the preview shows italic text.
3. **Given** the editor is open with text selected, **When** the user clicks Underline, **Then** the selected text is wrapped in `<u>...</u>` and the preview shows underlined text.
4. **Given** no text is selected, **When** the user clicks Bold, **Then** placeholder syntax `**bold text**` is inserted at the cursor position.
5. **Given** text already formatted as bold is selected, **When** the user clicks Bold again, **Then** the bold markers are removed (toggle off).

---

### User Story 2 - Apply Block-Level Formatting (Priority: P2)

A user is editing a lesson section and wants to structure content with headers, bullet lists, or numbered lists. They position the cursor on a line (or select multiple lines) and click the appropriate toolbar button. The current line(s) are transformed to the correct markdown block syntax.

**Why this priority**: Block-level formatting (headers, lists) creates the structural hierarchy of lesson content. It's the second most impactful formatting need and is independent of inline formatting.

**Independent Test**: Can be fully tested by placing the cursor on a plain line, clicking H1/H2/H3, bullet list, or numbered list, and verifying the line is prefixed with the correct markdown syntax and the preview renders the expected structure.

**Acceptance Scenarios**:

1. **Given** the cursor is on a plain text line, **When** the user clicks H1, **Then** the line is prefixed with `# ` and the preview shows a top-level heading.
2. **Given** the cursor is on a plain text line, **When** the user clicks H2 or H3, **Then** the line is prefixed with `## ` or `### ` respectively.
3. **Given** the cursor is on a plain text line, **When** the user clicks Unordered List, **Then** the line is prefixed with `- ` and the preview shows a bullet point.
4. **Given** multiple lines are selected, **When** the user clicks Unordered List, **Then** each selected line is prefixed with `- `.
5. **Given** the cursor is on a plain text line, **When** the user clicks Ordered List, **Then** the line is prefixed with `1. ` and the preview shows a numbered item.
6. **Given** a line already has a heading prefix, **When** the user clicks the same heading level, **Then** the prefix is removed (toggle off).

---

### User Story 3 - Set Text Alignment (Priority: P3)

A user wants to center a heading or justify a paragraph. They select the line(s) and click an alignment button (left, center, right, justify). The alignment is stored as an HTML-compatible markdown comment or attribute that renders correctly in the preview.

**Why this priority**: Alignment is less commonly needed than inline and block formatting but completes the formatting toolkit. It depends on the toolbar being established by P1/P2.

**Independent Test**: Can be fully tested by selecting a line, clicking Center alignment, and verifying the correct alignment marker is inserted and the preview reflects the centered layout.

**Acceptance Scenarios**:

1. **Given** text is selected, **When** the user clicks Center, **Then** the text is wrapped or annotated to render centered in the preview.
2. **Given** text is selected, **When** the user clicks Right, **Then** the text renders right-aligned in the preview.
3. **Given** center alignment is active on a line, **When** the user clicks Left (default), **Then** the alignment annotation is removed and the text returns to left-aligned.
4. **Given** text has an alignment applied, **When** the content is saved, **Then** the alignment is preserved when the section is reloaded.

---

### User Story 4 - Insert a Hyperlink (Priority: P4)

A user wants to embed a clickable link in lesson content. They select the link text in the editor and click the Link button. A small input prompt appears for them to enter the URL, and the selection is converted to `[text](url)` markdown syntax.

**Why this priority**: Link insertion requires a two-step interaction (select text + enter URL) making it slightly more complex than other formatting actions. It delivers real value for referencing external resources in lesson content.

**Independent Test**: Can be fully tested by selecting text, clicking the Link button, entering a URL in the prompt, confirming, and verifying `[text](url)` appears in the editor and renders as a clickable link in the preview.

**Acceptance Scenarios**:

1. **Given** text is selected, **When** the user clicks Link and enters a valid URL, **Then** the selection is converted to `[selected text](url)` and the preview shows a clickable hyperlink.
2. **Given** no text is selected, **When** the user clicks Link and enters a URL, **Then** `[link text](url)` is inserted at the cursor with placeholder link text.
3. **Given** a URL is entered without `https://`, **Then** the system prepends `https://` automatically.
4. **Given** the user clicks Link but cancels the URL prompt without entering anything, **Then** no change is made to the editor content.

---

### Edge Cases

- What happens when the user applies bold to text that is already italic? Both markers are applied: `***text***`.
- What happens when the user clicks a formatting button with the editor unfocused? The action is ignored or the editor is re-focused first.
- What happens when formatted content is very long (thousands of characters)? Toolbar actions still apply correctly without performance degradation.
- What happens when the user pastes raw markdown into the editor? It is stored as-is and rendered correctly in the preview — toolbar actions complement rather than conflict with manual markdown entry.
- What happens if the URL entered for a link is invalid (e.g., not a URL)? The link is still inserted as typed; validation is non-blocking.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The editor MUST display a formatting toolbar when in edit mode.
- **FR-002**: The toolbar MUST include buttons for: Bold, Italic, Underline, H1, H2, H3, Unordered List, Ordered List, Left alignment, Center alignment, Right alignment, Justify alignment, and Link.
- **FR-003**: Users MUST be able to apply inline formatting (Bold, Italic, Underline) by selecting text and clicking the corresponding toolbar button.
- **FR-004**: Users MUST be able to apply block formatting (headings, lists) to the current line or selected lines via toolbar buttons.
- **FR-005**: Users MUST be able to insert a hyperlink by selecting text, clicking the Link button, and entering a URL.
- **FR-006**: All formatting applied via the toolbar MUST be stored as standard markdown syntax (or HTML-compatible inline markup for underline and alignment).
- **FR-007**: The live preview panel MUST render all applied formatting correctly and immediately after each toolbar action.
- **FR-008**: Each formatting button MUST toggle — applying the same format to already-formatted text removes the formatting markers.
- **FR-009**: When no text is selected, inline formatting buttons MUST insert a placeholder at the cursor position.
- **FR-010**: The toolbar MUST be visually distinct from the editor content area and accessible via keyboard (tab-navigable buttons).
- **FR-011**: Toolbar actions MUST NOT affect content outside the current editor session — all changes require an explicit Save action.

### Key Entities

- **Formatted Section Content**: The markdown-compatible text stored per lesson section — includes standard markdown syntax for all toolbar-applied styles plus HTML-compatible inline markup for underline and alignment.
- **Toolbar Action**: A discrete formatting operation with a type (inline/block/alignment/link), a markdown representation, and toggle behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can apply any single formatting style (bold, header, list, etc.) to selected text in under 3 seconds.
- **SC-002**: All 13 toolbar actions produce valid, renderable markdown output that displays correctly in the preview panel.
- **SC-003**: Formatted content is preserved exactly as entered after saving and reloading a section — zero data loss on round-trip.
- **SC-004**: Toggle behavior works correctly for all applicable formats — applying the same format twice returns the text to its original unformatted state.
- **SC-005**: The formatting toolbar is accessible without a mouse — all buttons are reachable and activatable via keyboard alone.

## Assumptions

- The editor currently uses a plain `<textarea>` with a live markdown preview. The toolbar wraps this existing editor rather than replacing it with a rich-text editor.
- Underline is not a native markdown feature; it will be stored as `<u>text</u>` HTML, which renders correctly in the existing preview renderer (which supports GFM and HTML passthrough).
- Text alignment is not natively supported in standard markdown. It will be stored using HTML `<div style="text-align: ...">` wrappers, which render correctly in the existing HTML-capable preview.
- The toolbar is scoped to the section editor only — it does not appear in the chat panel or any other text input in the app.
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.) are out of scope for this feature but should not be prevented by the implementation.

## Scope Boundaries

### In Scope

- Formatting toolbar in the section editor with 13 actions: Bold, Italic, Underline, H1, H2, H3, Unordered List, Ordered List, Left, Center, Right, Justify, Link
- Toggle behavior for all applicable formatting types
- Placeholder insertion when no text is selected
- Live preview update on each toolbar action
- Persistent storage of formatted content as markdown/HTML-compatible markup

### Out of Scope

- Text color, background highlighting, font size changes, inline spacing
- Rich text / WYSIWYG editor replacement (textarea remains)
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- Image insertion
- Table insertion
- Undo/redo history beyond browser-native textarea undo
