# API Contract: Lesson Sections

**Base path**: `/api/lesson-plans/[id]/sections`
**Auth**: All endpoints require a valid Supabase session. The lesson plan's
`user_id` MUST match the authenticated user. Returns `401` if unauthenticated,
`403` if the plan belongs to another user, `404` if the plan does not exist.

---

## GET /api/lesson-plans/[id] (updated)

Returns the lesson plan with its full hierarchy (sections ordered by
`display_order`, each section with items ordered by `display_order`).

**Response 200**:
```json
{
  "lessonPlan": {
    "id": "uuid",
    "title": "string",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601",
    "sections": [
      {
        "id": "uuid",
        "title": "string",
        "slug": "string",
        "contentMarkdown": "string",
        "displayOrder": 10,
        "items": [
          {
            "id": "uuid",
            "title": "string",
            "anchorId": "string",
            "displayOrder": 10
          }
        ]
      }
    ]
  },
  "chatMessages": [ ... ]
}
```

---

## POST /api/lesson-plans/[id]/sections

Create a new section in the lesson plan.

**Request body**:
```json
{
  "title": "Prerequisites & Environment Setup",
  "slug": "prerequisites-environment-setup",   // optional — derived from title if omitted
  "contentMarkdown": "## Overview\n...",        // optional — defaults to ""
  "displayOrder": 10                            // optional — appended after last if omitted
}
```

**Response 201**:
```json
{
  "section": {
    "id": "uuid",
    "lessonPlanId": "uuid",
    "title": "string",
    "slug": "string",
    "contentMarkdown": "string",
    "displayOrder": 10,
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

**Error responses**:
- `400` — validation failure (missing title, invalid slug format)
- `409` — `{ "error": "slug_conflict", "message": "A section with slug '...' already exists in this plan." }`

---

## GET /api/lesson-plans/[id]/sections/[sectionId]

Returns the section with its ordered items.

**Response 200**:
```json
{
  "section": {
    "id": "uuid",
    "lessonPlanId": "uuid",
    "title": "string",
    "slug": "string",
    "contentMarkdown": "string",
    "displayOrder": 10,
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "anchorId": "string",
        "displayOrder": 10
      }
    ]
  }
}
```

**Error responses**:
- `404` — section not found or not in this plan

---

## PATCH /api/lesson-plans/[id]/sections/[sectionId]

Partial update. All fields optional; only provided fields are updated.

**Request body** (all fields optional):
```json
{
  "title": "string",
  "slug": "string",
  "contentMarkdown": "string",
  "displayOrder": 20
}
```

**Response 200**: Same shape as GET section (without items).

**Error responses**:
- `400` — validation failure
- `409` — slug conflict

---

## DELETE /api/lesson-plans/[id]/sections/[sectionId]

Deletes the section and all its items (cascade).

**Response 204**: No body.
**Error responses**:
- `404` — section not found
