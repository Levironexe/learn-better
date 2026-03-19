# Feature Specification: Hierarchical Lesson Plan Schema

**Feature Branch**: `003-hierarchical-lesson-schema`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Update the database schema from only one table to manage the lesson plans. Now I need it to have a good hierarchy. Specifically, chat will reference to one lesson plan. This lesson plan should link to multiple sections inside it. For example, Prerequisites & Environment Setup is the folder (section) and it has multiple children inside it: Required Tools & Technologies and Setting Up Your GitHub Environment. The section will have one markdown file that multiple children reference to. Think of a single page that links to the id using /#the-id"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chat Scoped to a Lesson Plan (Priority: P1)

A user opens a chat session that is associated with a specific lesson plan.
The system knows the full hierarchy of that plan — which sections exist and
which items they contain — so that the AI assistant can provide contextually
accurate guidance referencing the correct section and item the user is on.

**Why this priority**: Chat is the core interaction surface of the app. If the
hierarchy is not navigable from a chat session, none of the downstream
navigation or linking features work.

**Independent Test**: Load a chat message and resolve its associated lesson
plan. Verify the plan includes ordered sections and each section includes
its ordered items. Delivers the foundational data contract needed by all
other stories.

**Acceptance Scenarios**:

1. **Given** a chat message exists, **When** the chat's lesson plan is fetched,
   **Then** the response includes the lesson plan with its ordered sections
   and each section's ordered items.
2. **Given** a lesson plan with two sections (each with two items), **When**
   any chat message in that plan is loaded, **Then** the full hierarchy is
   reachable without N+1 queries.

---

### User Story 2 - Hierarchical Outline Navigation (Priority: P2)

A user views a lesson plan and sees an ordered outline: sections listed as
top-level groups, each containing their ordered items as children. Clicking
a section heading or item name navigates the user to the correct place in
the lesson content.

**Why this priority**: The outline is the primary navigation mechanism for
multi-section lessons. Without it, users cannot self-direct through the material.

**Independent Test**: Load a lesson plan's outline. Confirm sections render
in defined order, each section displays its items in order, and navigating
to an item scrolls the page to the correct anchor within the section's content.

**Acceptance Scenarios**:

1. **Given** a lesson plan with three sections in defined order, **When** the
   outline is rendered, **Then** the sections appear in their defined order
   with each section's items listed beneath it.
2. **Given** an item with anchor ID `required-tools`, **When** the user
   navigates to that item, **Then** the page scrolls to `#required-tools`
   within the parent section's markdown content.
3. **Given** a section with no items, **When** the outline is rendered,
   **Then** the section still appears with no children shown.

---

### User Story 3 - Direct Anchor Links to Items (Priority: P3)

A user can share or bookmark a direct link to a specific item within a
lesson plan. Following that link opens the lesson at the correct section
and scrolls to the item's position within the section's content.

**Why this priority**: Deep-linkability makes content reusable and shareable.
AI responses can reference specific items with a URL that lands the user
in the right context.

**Independent Test**: Construct a URL with a section slug and item anchor.
Navigate to that URL. Confirm the correct section content loads and the page
scrolls to the item heading.

**Acceptance Scenarios**:

1. **Given** a URL with a section slug and item anchor, **When** the user
   navigates to it, **Then** the correct section content loads and the
   viewport scrolls to the item heading.
2. **Given** an item anchor that no longer exists in the section, **When**
   the user follows a link containing that anchor, **Then** the page loads
   the section content from the top without an error.

---

### Edge Cases

- What happens when a lesson plan has no sections yet? The plan MUST still be
  creatable and chattable; the outline renders empty.
- What happens when a section has no items? The section MUST render its
  markdown content normally; no items are listed in the outline for it.
- What happens when two items in the same section share an anchor ID?
  The system MUST enforce uniqueness at the data layer and reject duplicates
  with a clear error.
- What happens when sections are reordered? Display order MUST update without
  affecting anchor IDs or breaking existing deep links.
- What happens to existing lesson plans that have content stored in the old
  `content` JSON field? The migration MUST handle this data without data loss
  (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A lesson plan MUST contain zero or more sections ordered by a
  defined sequence.
- **FR-002**: Each section MUST belong to exactly one lesson plan.
- **FR-003**: Each section MUST have a title, a URL-safe slug unique within
  the plan, a display order, and a markdown content field.
- **FR-004**: A section MUST contain zero or more items ordered by a defined
  sequence.
- **FR-005**: Each item MUST belong to exactly one section.
- **FR-006**: Each item MUST have a title, a display order, and an anchor ID
  that is unique within its parent section and usable as an HTML fragment
  identifier.
- **FR-007**: Items MUST NOT store their own markdown content — they reference
  a heading anchor within the parent section's markdown.
- **FR-008**: Chat messages MUST continue to reference a lesson plan; the
  existing foreign key relationship is preserved unchanged.
- **FR-009**: Deleting a lesson plan MUST cascade-delete its sections and
  their items.
- **FR-010**: Deleting a section MUST cascade-delete its items.
- **FR-011**: The system MUST reject duplicate anchor IDs within the same
  section at the data layer.
- **FR-012**: The system MUST reject duplicate section slugs within the same
  lesson plan at the data layer.

### Key Entities

- **Lesson Plan**: Top-level container for a course or learning module.
  Belongs to a user. Referenced by chat messages. Has an ordered list of
  sections. Identified by a unique ID.

- **Lesson Section**: A named grouping within a lesson plan, analogous to a
  chapter. Stores the full markdown content for that grouping. Has a title,
  a URL-safe slug (unique within the plan), a display order, and an ordered
  list of items. Example: "Prerequisites & Environment Setup".

- **Lesson Item**: A named subsection within a section. Does not carry its
  own markdown content — it maps to a heading anchor inside the parent
  section's markdown. Has a title, an anchor ID (e.g., `required-tools`),
  and a display order. Examples: "Required Tools & Technologies",
  "Setting Up Your GitHub Environment".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A lesson plan with 5 sections and 20 total items loads its full
  hierarchy in a single data fetch without N+1 queries.
- **SC-002**: 100% of existing chat messages remain correctly linked to their
  lesson plans after the schema migration; no data loss occurs.
- **SC-003**: A direct anchor link to any item resolves and scrolls to the
  correct position within 1 second on a standard connection.
- **SC-004**: Attempts to create duplicate anchor IDs within the same section
  are rejected with a descriptive error, never silently accepted.
- **SC-005**: Navigating from a chat session to the lesson outline takes a
  single interaction and renders the full hierarchy.

## Assumptions

- The existing `content: jsonb` field on `lesson_plans` will be dropped. Any
  existing data in that field will be migrated to a default section titled
  "Content" on the parent plan. If the field is empty, no default section
  is created.
- Slug format: lowercase, hyphen-separated, ASCII only (e.g.,
  `prerequisites-environment-setup`). Auto-derived from the title if not
  provided.
- Anchor ID format follows the same slug convention and MUST match the
  heading IDs generated by the markdown renderer for `/#anchor` navigation
  to work correctly.
- Display order is stored as an integer; gaps between values are allowed so
  reordering does not require renumbering all rows.
- The `lesson_plans` table retains its `user_id` FK to `profiles` and its
  relationship to `chat_messages` — only the content structure changes.
