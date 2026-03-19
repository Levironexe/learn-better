# Feature Specification: Section Content Editing

**Feature Branch**: `004-section-edit`
**Created**: 2026-03-19
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Section Content (Priority: P1)

A user viewing a lesson section can click an Edit button to enter edit mode, modify the section's markdown content in a text editor, see a live preview of the rendered output as they type, and save their changes with a Save button. The edited content persists and is reflected immediately in the lesson view.

**Why this priority**: Core functionality — without the ability to edit content, the rest of the feature has no purpose. Delivers immediate value by making lesson content customizable.

**Independent Test**: Can be fully tested by loading a lesson plan, clicking Edit on a section, modifying text, saving, and verifying the saved content appears in the rendered view.

**Acceptance Scenarios**:

1. **Given** a user is viewing a lesson section, **When** they click the Edit button, **Then** an editable text area appears containing the current section content alongside a live preview of the rendered markdown.
2. **Given** the user is in edit mode, **When** they type in the text area, **Then** the preview updates in real time to reflect the changes.
3. **Given** the user has made edits, **When** they click Save, **Then** the changes are persisted and the view returns to read mode showing the updated content.
4. **Given** the user has made edits, **When** they click Cancel, **Then** changes are discarded and the original content is restored.
5. **Given** the save request fails due to a network error, **When** the user clicks Save, **Then** an error message is shown and the user remains in edit mode with their changes intact.

---

### User Story 2 - Delete a Section (Priority: P2)

A user can permanently delete an entire lesson section using a Delete button. The system asks for confirmation before performing the deletion to prevent accidental data loss.

**Why this priority**: Necessary for content management but carries risk of data loss, so it is secondary to editing. Allows users to remove irrelevant or outdated sections.

**Independent Test**: Can be fully tested by loading a lesson plan with multiple sections, clicking Delete on one section, confirming, and verifying the section no longer appears.

**Acceptance Scenarios**:

1. **Given** a user is viewing a lesson section, **When** they click the Delete button, **Then** a confirmation prompt appears asking them to confirm the deletion.
2. **Given** the confirmation prompt is shown, **When** the user confirms, **Then** the section and all its child items are permanently removed and the view updates immediately.
3. **Given** the confirmation prompt is shown, **When** the user cancels, **Then** no data is deleted and the section remains unchanged.

---

### Edge Cases

- What happens if the user saves with empty content — section remains but displays nothing.
- What if a network error occurs during save — user stays in edit mode with changes intact and sees an error message.
- What happens when the user deletes the only remaining section in a lesson plan — the lesson plan view shows an empty state.
- Simultaneous edits by the same user in two browser tabs — last save wins.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an Edit button and a Delete button on each lesson section.
- **FR-002**: System MUST enter edit mode when the Edit button is clicked, showing the current raw content in an editable text area.
- **FR-003**: System MUST render a live markdown preview alongside the text area that updates as the user types.
- **FR-004**: System MUST provide a Save button in edit mode that persists the edited content and returns to read mode.
- **FR-005**: System MUST provide a Cancel button in edit mode that discards changes and returns to read mode without saving.
- **FR-006**: System MUST prompt the user for confirmation before permanently deleting a section.
- **FR-007**: System MUST remove the section and all associated child items upon confirmed deletion and update the view immediately.
- **FR-008**: System MUST display a clear error message if saving fails, keeping the user in edit mode with their unsaved content.
- **FR-009**: System MUST restrict edit and delete actions to the authenticated owner of the lesson plan.

### Key Entities

- **Lesson Section**: A named content block within a lesson plan, containing markdown content and ordered child items. Editable and deletable by its owner.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can enter edit mode, make a change, and save in under 30 seconds.
- **SC-002**: Live preview updates within 100ms of each keystroke, appearing instantaneous to users.
- **SC-003**: Deleted sections disappear from the view immediately upon confirmed deletion with no full page reload.
- **SC-004**: Save and delete operations complete and reflect in the UI within 2 seconds under normal network conditions.
- **SC-005**: 100% of delete operations require explicit user confirmation before any data is removed.

## Assumptions

- Only the authenticated owner of a lesson plan may edit or delete its sections; collaborative editing is out of scope.
- Cancel in edit mode discards all unsaved changes — no draft persistence between sessions.
- Deleting a section also deletes all child items within it (cascade).
- Empty content is permitted on save.
- The edit UI is inline within the existing lesson view, not a separate page.
