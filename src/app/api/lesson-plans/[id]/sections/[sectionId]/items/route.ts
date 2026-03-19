import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items } from '@/lib/db/schema'
import { eq, and, max } from 'drizzle-orm'
import { ItemWriteSchema } from '@/lib/db/validation'
import { slugify } from '@/lib/utils/slugify'

async function getAuthedSection(planId: string, sectionId: string, userId: string) {
  const plan = await db.query.lesson_plans.findFirst({
    where: and(eq(lesson_plans.id, planId), eq(lesson_plans.user_id, userId)),
  })
  if (!plan) return null

  return db.query.lesson_sections.findFirst({
    where: and(
      eq(lesson_sections.id, sectionId),
      eq(lesson_sections.lesson_plan_id, planId)
    ),
  })
}

export async function POST(
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
  const parsed = ItemWriteSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 400 })
  }

  const { title, anchor_id: providedAnchor, display_order } = parsed.data
  const anchorId = providedAnchor ?? slugify(title)

  let order = display_order
  if (order === undefined) {
    const [result] = await db
      .select({ maxOrder: max(lesson_items.display_order) })
      .from(lesson_items)
      .where(eq(lesson_items.section_id, sectionId))
    order = (result?.maxOrder ?? 0) + 10
  }

  try {
    const [item] = await db
      .insert(lesson_items)
      .values({
        section_id: sectionId,
        title,
        anchor_id: anchorId,
        display_order: order,
      })
      .returning()

    return Response.json(
      {
        item: {
          id: item.id,
          sectionId: item.section_id,
          title: item.title,
          anchorId: item.anchor_id,
          displayOrder: item.display_order,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        },
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return Response.json(
        { error: 'anchor_conflict', message: `An item with anchor '${anchorId}' already exists in this section.` },
        { status: 409 }
      )
    }
    console.error({ route: 'POST /items', sectionId, userId: user.id, error: err })
    return new Response('Internal server error', { status: 500 })
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  )
}
