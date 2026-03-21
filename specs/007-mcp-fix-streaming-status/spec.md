# Feature Specification: MCP Fix & Streaming Status Indicators

**Feature Branch**: `007-mcp-fix-streaming-status`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Fix Web Search MCP Tool and Add Streaming Status Indicators"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Uses Web Search During Lesson Creation (Priority: P1)

A user asks the agent to create a lesson on a topic that benefits from up-to-date information (e.g., "Create a lesson about recent advances in quantum computing"). The agent recognizes the need for web research, invokes the web search tool, retrieves relevant results, and incorporates them into the generated lesson content.

**Why this priority**: The web search MCP tool is currently broken, meaning the agent cannot access external information. This is the core bug fix that unblocks all web-augmented lesson generation.

**Independent Test**: Can be fully tested by asking the agent to create a lesson on a current-events topic and verifying that web search results appear in the generated content.

**Acceptance Scenarios**:

1. **Given** the MCP server is properly configured and running, **When** a user asks to create a lesson on a topic requiring current information, **Then** the agent successfully invokes the web search tool and incorporates results into the lesson.
2. **Given** the web search tool is available, **When** the agent performs a search, **Then** the search completes without errors and returns relevant results.
3. **Given** the web search tool encounters a transient error (e.g., network timeout), **When** the agent attempts a search, **Then** the agent gracefully falls back to generating content without web results and does not display an error to the user.

---

### User Story 2 - User Sees Real-Time Status During Agent Work (Priority: P2)

While the agent is processing a request that involves tool calls (e.g., web search, lesson generation), the user sees a real-time status indicator in the chat UI showing what the agent is currently doing. For example, "Searching the web..." appears while a web search is in progress, then disappears or collapses when the step completes.

**Why this priority**: Status indicators provide transparency into agent behavior, reducing user uncertainty during multi-step operations. This is a UX enhancement that builds on the working tool infrastructure from P1.

**Independent Test**: Can be tested by triggering any tool-using agent action and visually confirming that appropriate status messages appear and disappear in the chat.

**Acceptance Scenarios**:

1. **Given** the agent is performing a web search, **When** the search is in progress, **Then** the chat UI displays "Searching the web..." as a status indicator.
2. **Given** the agent is generating lesson content, **When** generation is in progress, **Then** the chat UI displays "Generating lesson..." as a status indicator.
3. **Given** a tool call completes, **When** the result is received, **Then** the corresponding status indicator disappears or collapses within the message flow.
4. **Given** multiple tool calls happen sequentially, **When** one completes and the next begins, **Then** the status updates to reflect the current active step.

---

### User Story 3 - Status Indicators for All Tool Types (Priority: P3)

The streaming status system works generically for all tool calls the agent may use, not just web search. Each tool type has a descriptive, user-friendly status message. As new tools are added in the future, the system supports adding new status labels without changing the indicator infrastructure.

**Why this priority**: Ensures the status system is extensible and covers all current and future agent capabilities, but depends on the core indicator mechanism from P2.

**Independent Test**: Can be tested by triggering different types of agent actions (search, generation, editing) and confirming each shows an appropriate, distinct status message.

**Acceptance Scenarios**:

1. **Given** the agent invokes a tool call of any type, **When** the call is in progress, **Then** a human-readable status message corresponding to that tool type is displayed.
2. **Given** a new tool type is added to the system, **When** a developer defines a status label for it, **Then** the indicator system displays it without requiring changes to the UI component.

---

### Edge Cases

- What happens when the web search MCP server process fails to start? The system should log the error and continue without web search capability.
- What happens when a tool call takes an unusually long time (>30 seconds)? The status indicator should remain visible until the call completes or times out.
- What happens when the user sends a new message while a tool call is still in progress? The current status should clear and the new request should be processed normally.
- What happens when the BRAVE_API_KEY environment variable is missing? The system should skip web search gracefully without showing an error to the user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The web search tool MUST be properly registered, reachable, and invokable by the agent during lesson creation.
- **FR-002**: The system MUST validate that the MCP server can start and connect before attempting tool calls.
- **FR-003**: The system MUST gracefully degrade when the web search tool is unavailable (missing API key, server failure), falling back to generation without web context.
- **FR-004**: The chat UI MUST display a status indicator when any tool call is in progress during agent processing.
- **FR-005**: Status indicators MUST show a human-readable description of the current agent activity (e.g., "Searching the web...", "Generating lesson...").
- **FR-006**: Status indicators MUST disappear or visually collapse once the corresponding tool call completes.
- **FR-007**: The status indicator system MUST support all current tool types and be extensible for future tools without UI component changes.
- **FR-008**: Only the existing tool logic should remain unchanged; fixes are limited to configuration, registration, and connectivity issues.

### Key Entities

- **Tool Call Status**: Represents the current state of an agent tool invocation — includes tool name, human-readable label, and active/completed state.
- **MCP Connection**: Represents the connection to the external MCP server process — includes connection state, available tools, and error information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The agent successfully retrieves and incorporates web search results in 95% of lesson creation requests that require current information.
- **SC-002**: Status indicators appear within 500ms of a tool call starting and disappear within 500ms of the tool call completing.
- **SC-003**: Users can identify what the agent is doing at any point during a multi-step operation by reading the status indicator.
- **SC-004**: The system continues to function normally (without web search) when external dependencies (API keys, MCP server) are unavailable.
- **SC-005**: Adding a status label for a new tool type requires no changes to the status indicator component itself.

## Assumptions

- The Brave Search API key is provided via the `BRAVE_API_KEY` environment variable and is assumed to be valid when present.
- The MCP server process (`@modelcontextprotocol/server-brave-search`) is available via npx and does not require separate installation.
- The current chat streaming architecture supports injecting status metadata alongside text content.
- Status messages follow a simple pattern: a short, present-progressive phrase describing the action (e.g., "Searching the web...").

## Scope Boundaries

### In Scope

- Diagnosing and fixing the MCP web search tool connectivity/configuration
- Adding streaming status indicators to the chat UI for all tool calls
- Mapping tool types to human-readable status labels

### Out of Scope

- Changing existing tool logic or behavior
- Adding new tools beyond what currently exists
- Persisting or logging tool call status history
- Customizing status indicator appearance per tool type (a single consistent style is sufficient)
