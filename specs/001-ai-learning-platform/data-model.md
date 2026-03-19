# Data Model: AI-Powered Learning Platform

**Feature**: 001-ai-learning-platform
**Date**: 2026-03-18

---

## Entities

### 1. Profile (extends Supabase Auth user)

Supabase Auth manages the core identity record (`auth.users`). The `profiles` table
stores app-specific user data and is linked 1-to-1 with `auth.users`.

**Table**: `profiles`

| Column             | Type                     | Constraints                        | Description                          |
|--------------------|--------------------------|------------------------------------|--------------------------------------|
| `id`               | `uuid`                   | PK, FK → `auth.users.id` ON DELETE CASCADE | Matches Supabase Auth user ID |
| `display_name`     | `text`                   | NOT NULL                           | User's display name                  |
| `avatar_url`       | `text`                   | nullable                           | Profile picture URL                  |
| `theme_preference` | `text`                   | NOT NULL, default `'light'`        | `'light'` or `'dark'`               |
| `created_at`       | `timestamp with time zone` | NOT NULL, default `now()`        | Account creation time                |

**Notes**:
- Row is auto-created via a Supabase database trigger on `auth.users` insert
- `avatar_url` may point to Supabase Storage or a third-party avatar (e.g., Gravatar)

---

### 2. LessonPlan

Represents a single AI-generated lesson plan document, scoped to a user.

**Table**: `lesson_plans`

| Column       | Type                       | Constraints                                    | Description                       |
|--------------|----------------------------|------------------------------------------------|-----------------------------------|
| `id`         | `uuid`                     | PK, default `gen_random_uuid()`                | Unique lesson plan identifier     |
| `user_id`    | `uuid`                     | NOT NULL, FK → `profiles.id` ON DELETE CASCADE | Owner                             |
| `title`      | `text`                     | NOT NULL                                       | Short display title               |
| `content`    | `jsonb`                    | NOT NULL, default `'{}'`                       | Structured lesson plan content    |
| `created_at` | `timestamp with time zone` | NOT NULL, default `now()`                      | When the plan was first created   |
| `updated_at` | `timestamp with time zone` | NOT NULL, default `now()`                      | Last modified time (AI revision)  |

**`content` JSONB structure** (`LessonPlanContent`):
```json
{
  "sections": [
    {
      "id": "section-uuid-or-slug",
      "title": "Section Title",
      "subsections": [
        {
          "id": "subsection-uuid-or-slug",
          "title": "Subsection Title",
          "body": "Markdown content string"
        }
      ]
    }
  ]
}
```

**Rules**:
- Maximum 2 levels of hierarchy: section → subsection
- `body` field is Markdown (rendered by `react-markdown` in the UI)
- `updated_at` is refreshed every time the AI modifies the content

---

### 3. ChatMessage

A single message in the conversation linked to a specific lesson plan. Stores the
full chat history so the AI has context for revisions.

**Table**: `chat_messages`

| Column            | Type                       | Constraints                                         | Description                        |
|-------------------|----------------------------|-----------------------------------------------------|------------------------------------|
| `id`              | `uuid`                     | PK, default `gen_random_uuid()`                     | Message identifier                 |
| `lesson_plan_id`  | `uuid`                     | NOT NULL, FK → `lesson_plans.id` ON DELETE CASCADE  | Associated lesson plan             |
| `role`            | `text`                     | NOT NULL, CHECK `role IN ('user', 'assistant')`     | Message sender                     |
| `content`         | `text`                     | NOT NULL                                            | Raw message text                   |
| `created_at`      | `timestamp with time zone` | NOT NULL, default `now()`                           | When message was sent              |

---

## Relationships

```
auth.users (Supabase managed)
    │ 1
    │
    ▼ 1
profiles
    │ 1
    │
    ▼ N
lesson_plans
    │ 1
    │
    ▼ N
chat_messages
```

- One `auth.users` → one `profiles` (1-to-1)
- One `profiles` → many `lesson_plans` (1-to-N)
- One `lesson_plans` → many `chat_messages` (1-to-N)
- All child rows cascade-delete when parent is deleted

---

## Indexes

```sql
-- Fast lookup of all lesson plans for a user (sorted by most recent)
CREATE INDEX idx_lesson_plans_user_id_updated ON lesson_plans(user_id, updated_at DESC);

-- Fast retrieval of chat history for a lesson plan (ordered)
CREATE INDEX idx_chat_messages_lesson_plan_id ON chat_messages(lesson_plan_id, created_at ASC);
```

---

## State Transitions

### LessonPlan content lifecycle

```
[empty] → AI generates initial plan (POST /api/chat with new lesson intent)
         → content JSONB populated, title set
         → user sends revision request
         → AI updates content JSONB, updated_at refreshed
         → (repeat revision cycle)
         → user deletes plan → row removed (cascades messages)
```

### Theme preference

```
'light' ↔ 'dark'  (toggled via navbar button, persisted to profiles.theme_preference)
```
