import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { SectionPatchSchema } from '@/lib/db/validation'
import { slugify } from '@/lib/utils/slugify'

async function getAuthedSection(planId: string, sectionId: string, userId: string) {
  const plan = await db.query.lesson_plans.findFirst({
    where: and(eq(lesson_plans.id, planId), eq(lesson_plans.user_id, userId)),
  })
  if (!plan) return null

  const section = await db.query.lesson_sections.findFirst({
    where: and(
      eq(lesson_sections.id, sectionId),
      eq(lesson_sections.lesson_plan_id, planId)
    ),
  })
  return section ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { id, sectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const section = await getAuthedSection(id, sectionId, user.id)
  if (!section) return new Response('Not found', { status: 404 })

  const items = await db
    .select()
    .from(lesson_items)
    .where(eq(lesson_items.section_id, sectionId))
    .orderBy(asc(lesson_items.display_order))

  return Response.json({ section: { ...section, items } })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { id, sectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const section = await getAuthedSection(id, sectionId, user.id)
  if (!section) return new Response('Not found', { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = SectionPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 400 })
  }

  const updates: Partial<typeof section> & { updated_at: Date } = { updated_at: new Date() }
  if (parsed.data.title !== undefined) updates.title = parsed.data.title
  if (parsed.data.slug !== undefined) updates.slug = parsed.data.slug
  else if (parsed.data.title !== undefined) updates.slug = slugify(parsed.data.title)
  if (parsed.data.content_markdown !== undefined) updates.content_markdown = parsed.data.content_markdown
  if (parsed.data.display_order !== undefined) updates.display_order = parsed.data.display_order

  try {
    const [updated] = await db
      .update(lesson_sections)
      .set(updates)
      .where(eq(lesson_sections.id, sectionId))
      .returning()

    return Response.json({ section: updated })
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return Response.json(
        { error: 'slug_conflict', message: `A section with that slug already exists in this plan.` },
        { status: 409 }
      )
    }
    console.error({ route: 'PATCH /sections/[sectionId]', sectionId, userId: user.id, error: err })
    return new Response('Internal server error', { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { id, sectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const section = await getAuthedSection(id, sectionId, user.id)
  if (!section) return new Response('Not found', { status: 404 })

  await db.delete(lesson_sections).where(eq(lesson_sections.id, sectionId))

  return new Response(null, { status: 204 })
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  )
}
