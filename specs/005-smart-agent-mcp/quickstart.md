# Quickstart: Smart Agent Behavior and MCP Integration

**Branch**: `005-smart-agent-mcp` | **Date**: 2026-03-19

---

## Happy Path 1 — Casual Message (No Lesson Plan Generated)

1. Open the app with no active lesson plan.
2. Type "hi" → send.
3. **Expected**: Agent replies conversationally (e.g., "Hello! What would you like to learn today?"). No proposal banner appears. No lesson plan is created.

---

## Happy Path 2 — Create Lesson Plan with Confirmation

1. Type "teach me Python basics" → send.
2. **Expected**: Chat stream includes a proposal banner: "Create this lesson plan?" with Accept and Decline buttons. The agent also streams a brief preview text.
3. Click **Accept**.
4. **Expected**: Proposal banner disappears. The docs panel populates with the new lesson plan. The plan appears in the plan list.

---

## Happy Path 3 — Decline a Proposal

1. Type "teach me Docker" → send.
2. Proposal banner appears.
3. Click **Decline**.
4. **Expected**: Proposal banner disappears. No lesson plan is created. Agent acknowledges: "No problem — let me know if you'd like to try a different topic."

---

## Happy Path 4 — Edit Existing Plan via Chat

1. Load an existing lesson plan.
2. Type "add a section about testing" → send.
3. **Expected**: Agent detects edit intent, generates updated plan, shows proposal banner: "Apply these edits?" with Accept and Decline.
4. Click **Accept**.
5. **Expected**: Docs panel updates showing the new section. Only the targeted change is applied.

---

## Happy Path 5 — Web Search Enhanced Lesson (with BRAVE_API_KEY)

1. Set `BRAVE_API_KEY` in `.env.local`.
2. Type "teach me about the latest Next.js 16 features" → send.
3. **Expected**: Proposal banner appears with a lesson plan that references current Next.js features. Agent may note "I searched the web for current information."

---

## Edge Cases to Verify

- Send "interesting" (ambiguous) — should NOT trigger a proposal.
- Send "thanks" after accepting — should NOT trigger a proposal.
- Accept proposal while network is offline — error shown in banner, plan NOT partially saved.
- Type an edit request with no active plan — agent responds: cannot edit without an active plan, prompts to create one first.
- `BRAVE_API_KEY` missing — lesson generation works normally, no search performed, no error shown.
