# API Contract: Lesson Items

**Base path**: `/api/lesson-plans/[id]/sections/[sectionId]/items`
**Auth**: All endpoints require a valid Supabase session. Ownership is verified
by resolving the section → lesson plan → user_id chain. Returns `401` if
unauthenticated, `403` if not the owner, `404` if the section or plan is not found.

---

## POST /api/lesson-plans/[id]/sections/[sectionId]/items

Create a new item in the section.

**Request body**:
```json
{
  "title": "Required Tools & Technologies",
  "anchorId": "required-tools-technologies",  // optional — derived from title if omitted
  "displayOrder": 10                          // optional — appended after last if omitted
}
```

**Response 201**:
```json
{
  "item": {
    "id": "uuid",
    "sectionId": "uuid",
    "title": "string",
    "anchorId": "string",
    "displayOrder": 10,
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

**Error responses**:
- `400` — validation failure (missing title, invalid anchor_id format)
- `409` — `{ "error": "anchor_conflict", "message": "An item with anchor '...' already exists in this section." }`

---

## PATCH /api/lesson-plans/[id]/sections/[sectionId]/items/[itemId]

Partial update. All fields optional.

**Request body** (all fields optional):
```json
{
  "title": "string",
  "anchorId": "string",
  "displayOrder": 20
}
```

**Response 200**:
```json
{
  "item": {
    "id": "uuid",
    "sectionId": "uuid",
    "title": "string",
    "anchorId": "string",
    "displayOrder": 20,
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

**Error responses**:
- `400` — validation failure
- `404` — item not found or not in this section
- `409` — anchor_id conflict

---

## DELETE /api/lesson-plans/[id]/sections/[sectionId]/items/[itemId]

Deletes the item.

**Response 204**: No body.
**Error responses**:
- `404` — item not found or not in this section
