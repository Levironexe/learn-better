import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const rows = await db
    .select({
      id: lesson_plans.id,
      title: lesson_plans.title,
      createdAt: lesson_plans.created_at,
      updatedAt: lesson_plans.updated_at,
    })
    .from(lesson_plans)
    .where(eq(lesson_plans.user_id, user.id))
    .orderBy(desc(lesson_plans.updated_at))

  return Response.json({ lessonPlans: rows })
}
