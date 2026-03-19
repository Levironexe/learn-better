import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ItemPatchSchema } from '@/lib/db/validation'
import { slugify } from '@/lib/utils/slugify'

async function getAuthedItem(
  planId: string,
  sectionId: string,
  itemId: string,
  userId: string
) {
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
  if (!section) return null

  return db.query.lesson_items.findFirst({
    where: and(
      eq(lesson_items.id, itemId),
      eq(lesson_items.section_id, sectionId)
    ),
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; itemId: string }> }
) {
  const { id, sectionId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const item = await getAuthedItem(id, sectionId, itemId, user.id)
  if (!item) return new Response('Not found', { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = ItemPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 400 })
  }

  const updates: Partial<typeof item> & { updated_at: Date } = { updated_at: new Date() }
  if (parsed.data.title !== undefined) updates.title = parsed.data.title
  if (parsed.data.anchor_id !== undefined) updates.anchor_id = parsed.data.anchor_id
  else if (parsed.data.title !== undefined) updates.anchor_id = slugify(parsed.data.title)
  if (parsed.data.display_order !== undefined) updates.display_order = parsed.data.display_order

  try {
    const [updated] = await db
      .update(lesson_items)
      .set(updates)
      .where(eq(lesson_items.id, itemId))
      .returning()

    return Response.json({
      item: {
        id: updated.id,
        sectionId: updated.section_id,
        title: updated.title,
        anchorId: updated.anchor_id,
        displayOrder: updated.display_order,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    })
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return Response.json(
        { error: 'anchor_conflict', message: 'An item with that anchor already exists in this section.' },
        { status: 409 }
      )
    }
    console.error({ route: 'PATCH /items/[itemId]', itemId, userId: user.id, error: err })
    return new Response('Internal server error', { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; itemId: string }> }
) {
  const { id, sectionId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const item = await getAuthedItem(id, sectionId, itemId, user.id)
  if (!item) return new Response('Not found', { status: 404 })

  await db.delete(lesson_items).where(eq(lesson_items.id, itemId))

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
