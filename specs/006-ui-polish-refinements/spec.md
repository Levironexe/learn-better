# Feature Specification: UI Polish & Refinements

**Feature Branch**: `006-ui-polish-refinements`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "UI modifications including increased border radius, collapsible/resizable chat panel, improved markdown content rendering, sign-out hover effect, skeleton loading states, redesigned chat input with embedded send button, and section action icons with copy functionality"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resizable & Collapsible Chat Panel (Priority: P1)

A user wants to focus on reading lesson content without the chat panel taking up screen space. They click a toggle to collapse the chat panel, which causes the content panel to expand to full width. Later, they want to ask a question, so they reopen the chat panel. They can also drag the divider between panels to customize the width ratio to their preference.

**Why this priority**: The panel layout directly impacts the core reading and learning experience. Users need control over how they allocate screen real estate between content and chat.

**Independent Test**: Can be tested by toggling the chat panel open/closed and dragging the divider, verifying the left panel expands/shrinks accordingly without overlay.

**Acceptance Scenarios**:

1. **Given** the chat panel is open, **When** the user clicks the collapse toggle, **Then** the chat panel closes and the content panel expands to fill the full available width with a smooth transition.
2. **Given** the chat panel is collapsed, **When** the user clicks the expand toggle, **Then** the chat panel reopens at its previous width and the content panel shrinks accordingly.
3. **Given** both panels are visible, **When** the user drags the divider between panels, **Then** both panels resize proportionally — the total width always equals the screen width with no overlay.
4. **Given** the user has resized the panels, **When** they navigate to another page and return, **Then** the panel widths persist within the session.

---

### User Story 2 - Improved Content Rendering (Priority: P1)

A user views AI-generated lesson content and sees well-formatted markdown with proper typography: clear heading hierarchy, readable paragraph spacing, styled lists with proper indentation, code blocks with distinct backgrounds, and appropriate font sizing throughout. The content no longer appears as a flat wall of text.

**Why this priority**: Content readability is the core value proposition of a learning platform. Poorly rendered content directly degrades the learning experience.

**Independent Test**: Can be tested by viewing any lesson section with mixed markdown content (headings, lists, bold text, code, blockquotes) and verifying proper visual hierarchy and spacing.

**Acceptance Scenarios**:

1. **Given** a section contains markdown with headings, bold text, and lists, **When** the content is rendered, **Then** headings have clear size differentiation (h2 visibly larger than h3, etc.), bold text is visually distinct, and lists have proper bullet/number styling with indentation.
2. **Given** a section contains inline code or code blocks, **When** rendered, **Then** code has a distinct background color and monospace font that stands out from surrounding prose.
3. **Given** content has multiple paragraphs, **When** rendered, **Then** paragraphs have consistent and comfortable spacing between them (not cramped, not excessive).

---

### User Story 3 - Section Action Icons with Copy (Priority: P2)

A user wants to copy the markdown content of a lesson section to use elsewhere (notes, documents, etc.). They see three icon buttons next to each section title: a pencil icon for edit, a clipboard/copy icon for copy, and a trash icon for delete. They click the copy icon and the full markdown content of that section is copied to their clipboard, with brief visual feedback confirming the action.

**Why this priority**: Copy functionality adds significant utility for learners who want to export content. Switching to icons reduces visual clutter and improves the action bar aesthetics.

**Independent Test**: Can be tested by clicking the copy icon on any section and pasting the content elsewhere to verify the full markdown was copied.

**Acceptance Scenarios**:

1. **Given** a section is displayed, **When** the user views the section header, **Then** they see three icon buttons (pencil/edit, clipboard/copy, trash/delete) instead of text-labeled buttons.
2. **Given** a section has markdown content, **When** the user clicks the copy icon, **Then** the entire markdown content of that section is copied to the system clipboard.
3. **Given** the user clicks the copy icon, **When** the copy succeeds, **Then** brief visual feedback is shown (e.g., the icon changes to a checkmark momentarily or a toast notification appears).
4. **Given** the user clicks the edit icon, **When** triggered, **Then** it behaves identically to the current Edit button functionality.
5. **Given** the user clicks the delete icon, **When** triggered, **Then** it behaves identically to the current Delete button functionality.

---

### User Story 4 - Redesigned Chat Input (Priority: P2)

A user wants to type a message to the AI assistant. They see a visually prominent input area with the send button embedded inside the text area (as a rounded circular button with an arrow-up icon). The entire input area is clearly visible and distinguishable from the background, making it easy to locate and use.

**Why this priority**: The chat input is a primary interaction point. A polished, modern design improves usability and perceived quality.

**Independent Test**: Can be tested by typing a message and clicking the embedded send button or pressing Enter, verifying the message sends correctly.

**Acceptance Scenarios**:

1. **Given** the chat panel is open, **When** the user views the input area, **Then** they see a clearly visible container with a text input and a circular send button (with arrow-up icon) positioned inside the container.
2. **Given** the send button, **When** viewed, **Then** it has a contrasting color relative to the input background (high visibility).
3. **Given** an empty input, **When** the user has not typed anything, **Then** the send button appears disabled/dimmed.
4. **Given** text is entered, **When** the user clicks the send button or presses Enter, **Then** the message sends and the input clears, matching existing send behavior.

---

### User Story 5 - Skeleton Loading States (Priority: P2)

A user navigates to a lesson plan and sees placeholder skeleton elements while the content loads from the database. This replaces blank screens or simple text loading indicators, providing a clear indication that content is loading and giving a sense of the layout to come.

**Why this priority**: Skeleton loading improves perceived performance and prevents layout shift, creating a more polished user experience.

**Independent Test**: Can be tested by loading a lesson plan on a slow connection (or with network throttling) and verifying skeleton placeholders appear in the left panel before content loads.

**Acceptance Scenarios**:

1. **Given** the user selects a lesson plan, **When** the content is loading from the database, **Then** skeleton placeholder elements are displayed in the left panel matching the expected content layout.
2. **Given** skeleton loading is displayed, **When** the data finishes loading, **Then** the skeleton smoothly transitions to the actual content without jarring layout shifts.
3. **Given** the sidebar navigation is loading, **When** sections haven't loaded yet, **Then** skeleton placeholders appear for the sidebar navigation items as well.

---

### User Story 6 - Increased Border Radius (Priority: P3)

A user notices that all interactive elements (buttons, text inputs, cards, and other bordered elements) have a more rounded, modern appearance using larger border radius values, creating a softer and more contemporary visual style across the application.

**Why this priority**: Purely cosmetic improvement that enhances overall visual polish without functional impact.

**Independent Test**: Can be tested by visually inspecting buttons, inputs, and cards across all views to confirm they use increased border radius.

**Acceptance Scenarios**:

1. **Given** any button in the application, **When** rendered, **Then** it displays with a visibly rounded border radius (equivalent to rounded-xl).
2. **Given** any text input field, **When** rendered, **Then** it displays with the same increased border radius.
3. **Given** any card or bordered container, **When** rendered, **Then** it displays with consistent increased border radius matching other elements.

---

### User Story 7 - Sign-Out Button Hover Effect (Priority: P3)

A user hovers over the sign-out button in the navigation bar and sees a visual hover effect consistent with the theme toggle button styling, making it clear the element is interactive and maintaining visual consistency across the navbar.

**Why this priority**: Minor visual consistency improvement. Low effort, low impact.

**Independent Test**: Can be tested by hovering over the sign-out button and comparing the hover effect with the theme toggle button.

**Acceptance Scenarios**:

1. **Given** the navbar is visible, **When** the user hovers over the sign-out button, **Then** a background highlight appears, matching the theme toggle button's hover behavior.
2. **Given** the sign-out button, **When** not hovered, **Then** it appears in its default state without the hover effect.

---

### Edge Cases

- What happens when the chat panel is collapsed and a new AI response arrives? The panel should remain collapsed but may indicate unread activity via a subtle visual cue.
- What happens when the user drags the panel divider to an extreme position? Minimum width constraints should prevent either panel from becoming unusable (minimum ~200px for chat, ~300px for content).
- What happens when the copy action fails (e.g., clipboard API not available)? A fallback or error message should inform the user.
- What happens on narrow viewports where both panels cannot fit comfortably? The panel resize should respect minimum widths and the collapse toggle becomes especially important.
- What happens when skeleton loading encounters an error during fetch? The skeleton should transition to an error state rather than loading indefinitely.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to collapse and expand the chat panel via a visible toggle control.
- **FR-002**: System MUST allow users to drag a divider between the content and chat panels to resize them, with both panels always summing to the full available width (no overlay).
- **FR-003**: System MUST enforce minimum width constraints on both panels during resize (content panel minimum ~300px, chat panel minimum ~200px).
- **FR-004**: System MUST render markdown content with proper visual hierarchy: differentiated heading sizes, styled lists, distinct code blocks, readable paragraph spacing, and appropriate bold/italic formatting.
- **FR-005**: System MUST display three icon-only action buttons per section: edit (pencil icon), copy (clipboard icon), and delete (trash icon).
- **FR-006**: System MUST copy the full markdown content of a section to the clipboard when the copy icon is clicked, with visual feedback on success.
- **FR-007**: System MUST display the chat input send button as a circular button with an arrow-up icon, positioned inside the text input container, with high contrast against the input background.
- **FR-008**: System MUST display skeleton loading placeholders in the left panel (content area and sidebar) while data is being fetched from the database.
- **FR-009**: System MUST apply increased border radius (rounded-xl equivalent) to all buttons, text inputs, and bordered interactive elements globally.
- **FR-010**: System MUST apply a hover effect to the sign-out button consistent with the theme toggle button's hover styling.
- **FR-011**: System MUST persist panel width preferences within the user's browser session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can collapse and expand the chat panel with a single click, with the content panel filling the freed space within 300ms.
- **SC-002**: Users can resize the panel split by dragging the divider, with real-time visual feedback during the drag operation.
- **SC-003**: Markdown content displays with at least 3 visually distinct heading levels, properly indented lists, and styled code blocks — no "wall of text" appearance.
- **SC-004**: Users can copy any section's markdown content with one click, confirmed by visual feedback within 500ms.
- **SC-005**: Skeleton loading placeholders appear within 100ms of initiating a data fetch, preventing blank content areas.
- **SC-006**: All interactive bordered elements (buttons, inputs) display with consistent, visibly rounded corners across the entire application.
- **SC-007**: The chat input area is clearly distinguishable from the surrounding background, with the send button visible and contrast-compliant.

## Assumptions

- The application already uses Tailwind CSS for styling — border radius changes will use Tailwind utility classes.
- The Clipboard API (navigator.clipboard) is available in target browsers. No legacy fallback is required.
- Panel resize state is stored in browser session/local storage, not in the database.
- The existing theme toggle hover effect (background highlight on hover) is the target style for the sign-out button.
- Skeleton loading applies to the left panel content and sidebar only; the chat panel's existing loading states are sufficient.
- An icon library (Lucide or similar) is available or will be added for pencil, copy, and trash icons.
