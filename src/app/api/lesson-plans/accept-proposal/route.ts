import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { LessonPlanContentSchema } from '@/lib/ai/index'
import type { LessonPlanContent } from '@/lib/ai/index'
import { slugify } from '@/lib/utils/slugify'
import { z } from 'zod'

const AcceptProposalSchema = z.object({
  title: z.string().min(1),
  content: LessonPlanContentSchema,
  lessonPlanId: z.string().uuid().optional().nullable(),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = AcceptProposalSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { title, content, lessonPlanId } = parsed.data

  // Upsert lesson_plans row
  let planId = lessonPlanId ?? null
  if (planId) {
    const existing = await db.query.lesson_plans.findFirst({
      where: and(eq(lesson_plans.id, planId), eq(lesson_plans.user_id, user.id)),
    })
    if (!existing) {
      return new Response('Lesson plan not found', { status: 404 })
    }
    await db
      .update(lesson_plans)
      .set({ title, updated_at: new Date() })
      .where(eq(lesson_plans.id, planId))
  } else {
    const [created] = await db
      .insert(lesson_plans)
      .values({ user_id: user.id, title })
      .returning()
    planId = created.id
  }

  // Wipe existing sections (cascade deletes items), then recreate
  await db.delete(lesson_sections).where(eq(lesson_sections.lesson_plan_id, planId))
  await persistSections(planId, content)

  return Response.json({ lessonPlanId: planId, title })
}

async function persistSections(planId: string, content: LessonPlanContent) {
  for (let si = 0; si < content.sections.length; si++) {
    const section = content.sections[si]

    const contentMarkdown = section.subsections
      .map((sub) => `## ${sub.title}\n\n${sub.body}`)
      .join('\n\n')

    const [savedSection] = await db
      .insert(lesson_sections)
      .values({
        lesson_plan_id: planId,
        title: section.title,
        slug: slugify(section.title),
        content_markdown: contentMarkdown,
        display_order: (si + 1) * 10,
      })
      .returning()

    if (section.subsections.length > 0) {
      await db.insert(lesson_items).values(
        section.subsections.map((sub, ii) => ({
          section_id: savedSection.id,
          title: sub.title,
          anchor_id: sub.id,
          body_markdown: sub.body,
          display_order: (ii + 1) * 10,
        }))
      )
    }
  }
}
