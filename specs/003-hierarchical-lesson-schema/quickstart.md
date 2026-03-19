# Quickstart: Hierarchical Lesson Plan Schema

**Feature**: 003-hierarchical-lesson-schema
**Purpose**: Validate the feature is working end-to-end after implementation.

## Prerequisites

- Local Supabase instance running (`supabase start`) or a dev project configured in `.env.local`
- `DATABASE_URL` and `DATABASE_URL_UNPOOLED` set in `.env.local`
- Dependencies installed: `npm install` (includes new vitest devDep)

## Step 1: Run the migration

```bash
npx drizzle-kit generate   # generates 0001_hierarchical_lesson_schema.sql
npx drizzle-kit migrate    # applies migration to dev DB
```

Verify: connect to the DB and confirm `lesson_sections` and `lesson_items` tables
exist. Confirm `lesson_plans.content` column is gone.

## Step 2: Run unit tests

```bash
npx vitest run src/lib/utils/slugify.test.ts
```

Expected: all slugify test cases pass. Specifically:
- `"Prerequisites & Environment Setup"` → `"prerequisites-environment-setup"`
- `"Required Tools & Technologies"` → `"required-tools-technologies"`
- Double spaces, leading/trailing symbols are normalized

## Step 3: Run integration tests

```bash
npx playwright test tests/api/lesson-hierarchy.spec.ts
npx playwright test tests/api/sections-items.spec.ts
```

Expected:
- Hierarchy fetch returns plan + sections + items in a single response
- Creating a section with duplicate slug returns 409
- Creating an item with duplicate anchor returns 409
- Deleting a section cascades to its items
- Chat message still correctly references the lesson plan

## Step 4: Manual smoke test

1. Start the dev server: `npm run dev`
2. Sign in and create a new lesson plan
3. Use the API (or UI once built) to add a section with a title and markdown content
4. Add two items to the section with different anchor IDs
5. Fetch `GET /api/lesson-plans/[id]` and confirm the full hierarchy is in the response
6. Navigate to `/lessons/[id]/sections/[slug]#[anchorId]` and confirm the page
   scrolls to the correct heading

## Validation Checklist

- [ ] `lesson_sections` and `lesson_items` tables created with correct constraints
- [ ] `lesson_plans.content` column removed
- [ ] Existing chat messages still reference correct lesson plans
- [ ] GET /api/lesson-plans/[id] returns hierarchy (sections + items)
- [ ] POST section with duplicate slug → 409
- [ ] POST item with duplicate anchor → 409
- [ ] DELETE section cascades to items
- [ ] Unit tests pass for slugify utility
- [ ] Integration tests pass
