# API Contracts: AI-Powered Learning Platform

**Feature**: 001-ai-learning-platform
**Date**: 2026-03-18
**Base URL**: `/api`
**Auth**: All endpoints require an authenticated Supabase session (cookie-based).
Unauthenticated requests receive `401 Unauthorized`.

---

## POST /api/chat

Sends a user message and receives a streamed AI response. If `lessonPlanId` is
provided, the AI operates in revision mode and may return an updated lesson plan
payload. If `lessonPlanId` is omitted, the AI creates a brand-new lesson plan.

### Request

```json
{
  "messages": [
    { "role": "user", "content": "I want to learn Git basics" }
  ],
  "lessonPlanId": "uuid | null"
}
```

| Field          | Type              | Required | Description                                      |
|----------------|-------------------|----------|--------------------------------------------------|
| `messages`     | `Message[]`       | Yes      | Full conversation history in AI SDK format       |
| `lessonPlanId` | `string` (uuid)   | No       | If present, revise this plan; if absent, create  |

### Response

**Content-Type**: `text/event-stream` (AI SDK data stream protocol)

The stream contains:
1. **Text parts** — the assistant's conversational reply (rendered in the chat panel)
2. **Data annotations** — the updated `LessonPlanContent` JSON and the resolved
   `lessonPlanId` (new UUID if created, same UUID if revised)

Stream annotation shape:
```json
{
  "type": "lesson-plan-update",
  "lessonPlanId": "uuid",
  "title": "string",
  "content": { "sections": [ ... ] }
}
```

### Side effects

- Persists the user's message and AI's response to `chat_messages`
- Creates or updates the `lesson_plans` row (content + updated_at)

### Error responses

| Status | Condition                          |
|--------|------------------------------------|
| 400    | `messages` array missing or empty  |
| 401    | Not authenticated                  |
| 404    | `lessonPlanId` not found or not owned by user |
| 500    | AI provider error                  |

---

## GET /api/lesson-plans

Returns all lesson plans for the authenticated user, ordered by most recently updated.

### Response

```json
{
  "lessonPlans": [
    {
      "id": "uuid",
      "title": "Git Basics",
      "createdAt": "2026-03-18T10:00:00Z",
      "updatedAt": "2026-03-18T10:05:00Z"
    }
  ]
}
```

List items include metadata only — `content` is excluded to keep the list response small.

### Error responses

| Status | Condition       |
|--------|-----------------|
| 401    | Not authenticated |

---

## GET /api/lesson-plans/[id]

Returns the full lesson plan including structured content and chat history.

### Response

```json
{
  "lessonPlan": {
    "id": "uuid",
    "title": "Git Basics",
    "content": {
      "sections": [
        {
          "id": "s1",
          "title": "Introduction to Git",
          "subsections": [
            {
              "id": "s1-1",
              "title": "What is Version Control?",
              "body": "Version control is a system that records changes..."
            }
          ]
        }
      ]
    },
    "createdAt": "2026-03-18T10:00:00Z",
    "updatedAt": "2026-03-18T10:05:00Z"
  },
  "chatMessages": [
    { "id": "uuid", "role": "user", "content": "I want to learn Git basics", "createdAt": "..." },
    { "id": "uuid", "role": "assistant", "content": "Here's your lesson plan...", "createdAt": "..." }
  ]
}
```

### Error responses

| Status | Condition                              |
|--------|----------------------------------------|
| 401    | Not authenticated                      |
| 404    | Plan not found or not owned by user    |

---

## PATCH /api/lesson-plans/[id]

Updates the title of a lesson plan. Content is only updated via `POST /api/chat`.

### Request

```json
{
  "title": "string"
}
```

### Response

```json
{
  "lessonPlan": {
    "id": "uuid",
    "title": "Updated Title",
    "updatedAt": "2026-03-18T11:00:00Z"
  }
}
```

### Error responses

| Status | Condition                              |
|--------|----------------------------------------|
| 400    | `title` missing or empty               |
| 401    | Not authenticated                      |
| 404    | Plan not found or not owned by user    |

---

## DELETE /api/lesson-plans/[id]

Deletes a lesson plan and all its associated chat messages (cascade).

### Response

`204 No Content`

### Error responses

| Status | Condition                              |
|--------|----------------------------------------|
| 401    | Not authenticated                      |
| 404    | Plan not found or not owned by user    |
