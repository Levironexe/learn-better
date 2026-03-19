# Data Model: Hierarchical Lesson Plan Schema

**Feature**: 003-hierarchical-lesson-schema
**Date**: 2026-03-19

## Entity Relationship Overview

```
profiles (existing)
  └─< lesson_plans (existing — content field REMOVED)
        └─< lesson_sections (NEW)
              └─< lesson_items (NEW)

chat_messages (existing)
  >── lesson_plan_id → lesson_plans.id  (unchanged)
```

---

## Entities

### profiles (unchanged)

| Column            | Type        | Constraints                   |
|-------------------|-------------|-------------------------------|
| id                | uuid        | PK, FK auth.users(id) CASCADE |
| display_name      | text        | NOT NULL                      |
| avatar_url        | text        | nullable                      |
| theme_preference  | text        | NOT NULL DEFAULT 'light'      |
| created_at        | timestamptz | NOT NULL DEFAULT now()        |

---

### lesson_plans (modified — `content` column removed)

| Column     | Type        | Constraints                             |
|------------|-------------|-----------------------------------------|
| id         | uuid        | PK DEFAULT gen_random_uuid()            |
| user_id    | uuid        | NOT NULL, FK profiles(id) CASCADE DELETE|
| title      | text        | NOT NULL                                |
| created_at | timestamptz | NOT NULL DEFAULT now()                  |
| updated_at | timestamptz | NOT NULL DEFAULT now()                  |

**Indexes**:
- `idx_lesson_plans_user_id_updated ON (user_id, updated_at DESC)` (existing)

---

### lesson_sections (NEW)

| Column           | Type        | Constraints                                    |
|------------------|-------------|------------------------------------------------|
| id               | uuid        | PK DEFAULT gen_random_uuid()                   |
| lesson_plan_id   | uuid        | NOT NULL, FK lesson_plans(id) CASCADE DELETE   |
| title            | text        | NOT NULL                                       |
| slug             | text        | NOT NULL — URL-safe, derived from title        |
| content_markdown | text        | NOT NULL DEFAULT ''                            |
| display_order    | integer     | NOT NULL                                       |
| created_at       | timestamptz | NOT NULL DEFAULT now()                         |
| updated_at       | timestamptz | NOT NULL DEFAULT now()                         |

**Constraints**:
- `UNIQUE (lesson_plan_id, slug)` — slug must be unique within a plan

**Indexes**:
- `idx_lesson_sections_plan_order ON (lesson_plan_id, display_order ASC)`

**Slug rules**: lowercase, alphanumeric + hyphens only, no leading/trailing hyphens.
Auto-derived from `title` via `slugify()`. Manual override allowed at creation.

---

### lesson_items (NEW)

| Column        | Type        | Constraints                                       |
|---------------|-------------|---------------------------------------------------|
| id            | uuid        | PK DEFAULT gen_random_uuid()                      |
| section_id    | uuid        | NOT NULL, FK lesson_sections(id) CASCADE DELETE   |
| title         | text        | NOT NULL                                          |
| anchor_id     | text        | NOT NULL — HTML fragment identifier               |
| display_order | integer     | NOT NULL                                          |
| created_at    | timestamptz | NOT NULL DEFAULT now()                            |
| updated_at    | timestamptz | NOT NULL DEFAULT now()                            |

**Constraints**:
- `UNIQUE (section_id, anchor_id)` — anchor must be unique within a section

**Indexes**:
- `idx_lesson_items_section_order ON (section_id, display_order ASC)`

**Anchor ID rules**: Same format as slug. MUST match the heading ID that
`react-markdown` + `remark-gfm` would generate for the corresponding heading
in `content_markdown`, so `/#anchor_id` navigation works without a mapping table.

---

### chat_messages (unchanged)

| Column         | Type        | Constraints                                     |
|----------------|-------------|-------------------------------------------------|
| id             | uuid        | PK DEFAULT gen_random_uuid()                    |
| lesson_plan_id | uuid        | NOT NULL, FK lesson_plans(id) CASCADE DELETE    |
| role           | text        | NOT NULL CHECK role IN ('user', 'assistant')    |
| content        | text        | NOT NULL                                        |
| created_at     | timestamptz | NOT NULL DEFAULT now()                          |

**Indexes**:
- `idx_chat_messages_lesson_plan_id ON (lesson_plan_id, created_at ASC)` (existing)

---

## Drizzle Relations

```typescript
// In schema.ts — defines relations for db.query relational API
export const lessonPlansRelations = relations(lesson_plans, ({ many }) => ({
  sections: many(lesson_sections),
}))

export const lessonSectionsRelations = relations(lesson_sections, ({ one, many }) => ({
  lessonPlan: one(lesson_plans, {
    fields: [lesson_sections.lesson_plan_id],
    references: [lesson_plans.id],
  }),
  items: many(lesson_items),
}))

export const lessonItemsRelations = relations(lesson_items, ({ one }) => ({
  section: one(lesson_sections, {
    fields: [lesson_items.section_id],
    references: [lesson_sections.id],
  }),
}))
```

---

## Migration Plan

### Migration file: `0001_hierarchical_lesson_schema.sql`

Generated by `drizzle-kit generate` after schema.ts is updated, then manually
augmented with the data migration block:

```sql
-- Step 1: Create lesson_sections
CREATE TABLE lesson_sections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id   uuid NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
  title            text NOT NULL,
  slug             text NOT NULL,
  content_markdown text NOT NULL DEFAULT '',
  display_order    integer NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_section_slug UNIQUE (lesson_plan_id, slug)
);
CREATE INDEX idx_lesson_sections_plan_order
  ON lesson_sections(lesson_plan_id, display_order ASC);

-- Step 2: Create lesson_items
CREATE TABLE lesson_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     uuid NOT NULL REFERENCES lesson_sections(id) ON DELETE CASCADE,
  title          text NOT NULL,
  anchor_id      text NOT NULL,
  display_order  integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_item_anchor UNIQUE (section_id, anchor_id)
);
CREATE INDEX idx_lesson_items_section_order
  ON lesson_items(section_id, display_order ASC);

-- Step 3: Migrate existing content JSON → default section
DO $$
BEGIN
  INSERT INTO lesson_sections (lesson_plan_id, title, slug, content_markdown, display_order)
  SELECT id, 'Content', 'content', content::text, 10
  FROM   lesson_plans
  WHERE  content IS DISTINCT FROM '{}'::jsonb;
END;
$$;

-- Step 4: Drop content column
ALTER TABLE lesson_plans DROP COLUMN content;
```

---

## Validation Rules (Zod — enforced at API layer)

```typescript
// Section create/update
const SectionWriteSchema = z.object({
  title:            z.string().min(1).max(255),
  slug:             z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  content_markdown: z.string().optional(),
  display_order:    z.number().int().positive().optional(),
})

// Item create/update
const ItemWriteSchema = z.object({
  title:         z.string().min(1).max(255),
  anchor_id:     z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  display_order: z.number().int().positive().optional(),
})
```
