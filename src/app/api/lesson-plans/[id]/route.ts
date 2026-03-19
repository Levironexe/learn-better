import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items, chat_messages } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await db.query.lesson_plans.findFirst({
    where: and(eq(lesson_plans.id, id), eq(lesson_plans.user_id, user.id)),
    with: {
      sections: {
        orderBy: asc(lesson_sections.display_order),
        with: {
          items: {
            orderBy: asc(lesson_items.display_order),
          },
        },
      },
    },
  })

  if (!plan) return new Response('Not found', { status: 404 })

  const msgs = await db
    .select()
    .from(chat_messages)
    .where(eq(chat_messages.lesson_plan_id, id))
    .orderBy(asc(chat_messages.created_at))

  return Response.json({ lessonPlan: plan, chatMessages: msgs })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { title } = await req.json()
  if (!title?.trim()) return new Response('title is required', { status: 400 })

  const plan = await db.query.lesson_plans.findFirst({
    where: and(eq(lesson_plans.id, id), eq(lesson_plans.user_id, user.id)),
  })

  if (!plan) return new Response('Not found', { status: 404 })

  const [updated] = await db
    .update(lesson_plans)
    .set({ title, updated_at: new Date() })
    .where(eq(lesson_plans.id, id))
    .returning()

  return Response.json({ lessonPlan: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await db.query.lesson_plans.findFirst({
    where: and(eq(lesson_plans.id, id), eq(lesson_plans.user_id, user.id)),
  })

  if (!plan) return new Response('Not found', { status: 404 })

  await db.delete(lesson_plans).where(eq(lesson_plans.id, id))

  return new Response(null, { status: 204 })
}
