import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LessonPlanPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

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

  if (!plan) notFound()

  const firstSection = plan.sections[0]

  return (
    <div className="flex min-h-screen">
      {/* Outline sidebar */}
      <nav className="w-72 shrink-0 border-r p-6 overflow-y-auto">
        <h1 className="text-lg font-semibold mb-4">{plan.title}</h1>
        {plan.sections.length === 0 ? (
          <p className="text-sm text-gray-500">No sections yet.</p>
        ) : (
          <ol className="space-y-4">
            {plan.sections.map((section) => (
              <li key={section.id}>
                <Link
                  href={`/lessons/${id}/sections/${section.slug}`}
                  className="text-sm font-medium hover:underline block"
                >
                  {section.title}
                </Link>
                {section.items.length > 0 && (
                  <ol className="mt-1 ml-3 space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/lessons/${id}/sections/${section.slug}#${item.anchor_id}`}
                          className="text-xs text-gray-600 hover:underline block"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        )}
      </nav>

      {/* Main content — redirect to first section automatically */}
      <main className="flex-1 p-8">
        <p className="text-gray-500">
          {firstSection
            ? 'Select a section from the outline to get started.'
            : 'This lesson plan has no sections yet.'}
        </p>
      </main>
    </div>
  )
}
