-- Migration: 0001_hierarchical_lesson_schema
-- Adds lesson_sections and lesson_items tables, migrates legacy content JSON,
-- and removes the content column from lesson_plans.

-- Step 1: Create lesson_sections
CREATE TABLE IF NOT EXISTS public.lesson_sections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id   uuid NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  title            text NOT NULL,
  slug             text NOT NULL,
  content_markdown text NOT NULL DEFAULT '',
  display_order    integer NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_section_slug UNIQUE (lesson_plan_id, slug)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_lesson_sections_plan_order
  ON public.lesson_sections(lesson_plan_id, display_order ASC);
--> statement-breakpoint

-- Step 2: Create lesson_items
CREATE TABLE IF NOT EXISTS public.lesson_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     uuid NOT NULL REFERENCES public.lesson_sections(id) ON DELETE CASCADE,
  title          text NOT NULL,
  anchor_id      text NOT NULL,
  display_order  integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_item_anchor UNIQUE (section_id, anchor_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_lesson_items_section_order
  ON public.lesson_items(section_id, display_order ASC);
--> statement-breakpoint

-- Step 3: Migrate existing non-empty content JSON to a default section
DO $$
BEGIN
  INSERT INTO public.lesson_sections
    (lesson_plan_id, title, slug, content_markdown, display_order)
  SELECT
    id,
    'Content',
    'content',
    content::text,
    10
  FROM public.lesson_plans
  WHERE content IS DISTINCT FROM '{}'::jsonb;
END;
$$;
--> statement-breakpoint

-- Step 4: Drop the now-redundant content column
ALTER TABLE public.lesson_plans DROP COLUMN IF EXISTS content;
