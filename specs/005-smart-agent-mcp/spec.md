# Feature Specification: Smart Agent Behavior and MCP Integration

**Feature Branch**: `005-smart-agent-mcp`
**Created**: 2026-03-19
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Intent-Aware Lesson Generation (Priority: P1)

Currently the AI agent generates a new lesson plan document for every message, even casual ones like "hi" or "thanks". Users need the agent to understand their intent — only generating or updating lesson content when the message clearly requests it, and staying conversational otherwise.

**Why this priority**: This is the most disruptive current behavior. Users experience unwanted document generation on every message, which breaks the conversational flow and produces junk lesson plans. Fixing this is the foundation for all other agent improvements.

**Independent Test**: Can be fully tested by sending a variety of messages (casual greetings, questions, explicit lesson requests) and verifying the agent only generates lesson content when the intent is clearly educational.

**Acceptance Scenarios**:

1. **Given** a user sends "hi" or "thanks", **When** the agent responds, **Then** no lesson plan is generated or updated — the agent replies conversationally.
2. **Given** a user sends "teach me Python basics", **When** the agent responds, **Then** a lesson plan is generated and the agent asks the user to confirm before saving it.
3. **Given** a user sends an ambiguous message like "what do you think?", **When** the agent responds, **Then** the agent replies conversationally without generating a lesson plan.
4. **Given** the agent determines a lesson plan should be generated, **When** it presents the plan, **Then** a confirmation prompt appears asking "Create this lesson plan?" with Accept and Decline options before any content is saved.
5. **Given** the user declines the confirmation, **When** the agent receives the decline, **Then** no lesson plan is saved and the agent acknowledges the decision.

---

### User Story 2 - Edit Existing Lesson Content via Chat (Priority: P2)

Users want to update specific parts of an existing lesson plan by describing the change in natural language (e.g., "make the intro section shorter" or "add a section on error handling"). The agent should understand the edit intent and apply the changes to the existing content rather than creating a new plan from scratch.

**Why this priority**: Once intent detection works (US1), the natural next capability is targeted editing. Users currently have no way to refine AI-generated content via chat without replacing the whole plan.

**Independent Test**: Can be fully tested by loading an existing lesson plan, sending an edit instruction in chat, and verifying only the described change is applied to the existing content — not a full replacement.

**Acceptance Scenarios**:

1. **Given** a user has an active lesson plan and sends "make the intro shorter", **When** the agent responds, **Then** it identifies this as an edit intent and presents the proposed change with a confirmation prompt before applying it.
2. **Given** the agent proposes an edit and the user confirms, **When** the change is applied, **Then** only the targeted section is updated — other sections remain unchanged.
3. **Given** a user says "add a section about X", **When** the agent responds, **Then** it appends the new section to the existing plan and confirms with the user before saving.
4. **Given** the user declines a proposed edit, **When** the agent receives the decline, **Then** the lesson plan is unchanged and the agent acknowledges the decision.

---

### User Story 3 - Web Search Integration (Priority: P3)

Users want the agent to fetch up-to-date information from the web when generating or updating lesson plans, rather than relying solely on its training data. For example, "create a lesson on the latest React features" should pull current documentation.

**Why this priority**: Enhances lesson quality and accuracy, especially for fast-moving topics. Dependent on US1 and US2 being stable first, as it adds an external data dimension to the generation flow.

**Independent Test**: Can be fully tested by requesting a lesson on a topic with recent developments (e.g., a newly released framework) and verifying the generated content references current information not likely in training data.

**Acceptance Scenarios**:

1. **Given** a user requests a lesson on a topic that may have recent developments, **When** the agent generates content, **Then** it searches the web for current information and incorporates it into the lesson plan.
2. **Given** a web search is about to be performed, **When** the agent initiates the search, **Then** the user is informed that external data is being fetched (e.g., "Searching the web for current information…").
3. **Given** a web search fails or returns no useful results, **When** the agent continues, **Then** it falls back to generating content from its training knowledge and informs the user.

---

### Edge Cases

- What if the user's message is borderline between casual and educational (e.g., "interesting topic")? — Agent should err on the side of conversational, not generate a plan.
- What if the user confirms a lesson plan but the save operation fails? — Error is shown, no data is lost, user can retry.
- What if the user edits a plan that was AI-streamed but not yet persisted? — Edit should only be available for persisted plans; agent should prompt user to save first.
- What if a web search returns biased or low-quality content? — Agent uses its judgment to curate; quality of sourcing is not guaranteed and should be disclosed to the user.
- What if the user declines a lesson plan but immediately sends another request? — The agent treats the new message fresh, with no memory of the declined plan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST analyze each user message to determine intent — conversational, lesson generation, or content editing — before deciding on an action.
- **FR-002**: System MUST NOT generate or update lesson content in response to messages that do not express educational intent.
- **FR-003**: System MUST present a confirmation prompt to the user before saving any generated or edited lesson plan content.
- **FR-004**: System MUST allow the user to accept or decline any proposed lesson plan creation or edit.
- **FR-005**: System MUST respond conversationally (without lesson plan actions) when the user's message is casual, greeting-like, or non-educational.
- **FR-006**: System MUST support targeted editing of existing lesson plans based on natural language instructions, modifying only the described sections.
- **FR-007**: System MUST distinguish between "create new plan" intent and "edit existing plan" intent based on context.
- **FR-008**: System MUST be able to fetch current information from the web when generating lesson content on topics that may have recent developments.
- **FR-009**: System MUST inform the user when external web sources are being consulted.
- **FR-010**: System MUST gracefully fall back to training knowledge if web search is unavailable or returns no useful results.

### Key Entities

- **User Message Intent**: The classification of a user's message — one of: conversational, lesson generation request, or content edit request.
- **Lesson Plan Proposal**: A generated or modified lesson plan pending user confirmation before being saved.
- **Web Search Result**: External content fetched to enrich lesson generation, attributed and curated before inclusion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0% of casual or conversational messages (greetings, thanks, off-topic questions) trigger lesson plan generation.
- **SC-002**: 100% of lesson plan creations and edits require explicit user confirmation before content is saved.
- **SC-003**: Users can request a targeted edit and have it applied to only the relevant section in under 10 seconds.
- **SC-004**: When web search is enabled, lesson plans on recent topics include information less than 6 months old at least 80% of the time.
- **SC-005**: Agent correctly classifies user intent (conversational vs. educational) with at least 95% accuracy across a representative set of test messages.

## Assumptions

- YouTube does not have an official MCP server; web search via a general web-fetching MCP is the only external integration in scope.
- Intent detection uses the same LLM model already powering the chat — no separate classifier is added.
- Confirmation prompts are inline in the chat UI (not modal dialogs) — consistent with the existing chat interaction pattern.
- Editing applies to the currently active lesson plan; users cannot edit a plan that is not loaded.
- Web search is opt-in at the system level (configured once), not per-message.
