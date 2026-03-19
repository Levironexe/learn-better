import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items } from '@/lib/db/schema'
import { eq, and, asc, max } from 'drizzle-orm'
import { SectionWriteSchema } from '@/lib/db/validation'
import { slugify } from '@/lib/utils/slugify'

async function getAuthedPlan(planId: string, userId: string) {
  return db.query.lesson_plans.findFirst({
    where: and(eq(lesson_plans.id, planId), eq(lesson_plans.user_id, userId)),
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await getAuthedPlan(id, user.id)
  if (!plan) return new Response('Not found', { status: 404 })

  const sections = await db
    .select()
    .from(lesson_sections)
    .where(eq(lesson_sections.lesson_plan_id, id))
    .orderBy(asc(lesson_sections.display_order))

  return Response.json({ sections })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await getAuthedPlan(id, user.id)
  if (!plan) return new Response('Not found', { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = SectionWriteSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 400 })
  }

  const { title, slug: providedSlug, content_markdown, display_order } = parsed.data

  const slug = providedSlug ?? slugify(title)

  let order = display_order
  if (order === undefined) {
    const [result] = await db
      .select({ maxOrder: max(lesson_sections.display_order) })
      .from(lesson_sections)
      .where(eq(lesson_sections.lesson_plan_id, id))
    order = (result?.maxOrder ?? 0) + 10
  }

  try {
    const [section] = await db
      .insert(lesson_sections)
      .values({
        lesson_plan_id: id,
        title,
        slug,
        content_markdown: content_markdown ?? '',
        display_order: order,
      })
      .returning()

    return Response.json({ section }, { status: 201 })
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return Response.json(
        { error: 'slug_conflict', message: `A section with slug '${slug}' already exists in this plan.` },
        { status: 409 }
      )
    }
    console.error({ route: 'POST /sections', planId: id, userId: user.id, error: err })
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
