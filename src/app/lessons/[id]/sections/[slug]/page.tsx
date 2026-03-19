import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, lesson_items } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type { Components } from 'react-markdown'

interface Props {
  params: Promise<{ id: string; slug: string }>
}

export default async function SectionPage({ params }: Props) {
  const { id, slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Verify plan ownership
  const plan = await db.query.lesson_plans.findFirst({
    where: and(eq(lesson_plans.id, id), eq(lesson_plans.user_id, user.id)),
    with: {
      sections: {
        orderBy: asc(lesson_sections.display_order),
        with: {
          items: { orderBy: asc(lesson_items.display_order) },
        },
      },
    },
  })

  if (!plan) notFound()

  // Find section by slug — unknown slug returns 404 gracefully (T016)
  const section = plan.sections.find((s) => s.slug === slug)
  if (!section) notFound()

  // Custom heading components so remark-gfm heading IDs match anchor_id values,
  // enabling native browser #fragment navigation without a mapping table.
  const headingComponents: Components = {
    h1: ({ children, ...props }) => <h1 id={toAnchorId(children)} {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 id={toAnchorId(children)} {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 id={toAnchorId(children)} {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 id={toAnchorId(children)} {...props}>{children}</h4>,
  }

  return (
    <div className="flex min-h-screen">
      {/* Outline sidebar */}
      <nav className="w-72 shrink-0 border-r p-6 overflow-y-auto">
        <Link href={`/lessons/${id}`} className="text-sm text-gray-500 hover:underline mb-4 block">
          ← {plan.title}
        </Link>
        <ol className="space-y-4">
          {plan.sections.map((s) => (
            <li key={s.id}>
              <Link
                href={`/lessons/${id}/sections/${s.slug}`}
                className={`text-sm font-medium hover:underline block ${s.id === section.id ? 'text-blue-600' : ''}`}
              >
                {s.title}
              </Link>
              {s.id === section.id && s.items.length > 0 && (
                <ol className="mt-1 ml-3 space-y-1">
                  {s.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.anchor_id}`}
                        className="text-xs text-gray-600 hover:underline block"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Section markdown content */}
      <article className="flex-1 p-8 prose prose-neutral max-w-4xl">
        <h1>{section.title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={headingComponents}>
          {section.content_markdown}
        </ReactMarkdown>
      </article>
    </div>
  )
}

/**
 * Converts React children (heading text) to an anchor-safe ID.
 * Mirrors the slugify() utility so IDs match anchor_id values in DB.
 */
function toAnchorId(children: React.ReactNode): string {
  const text = extractText(children)
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as React.ReactElement)) {
    const children = (node as React.ReactElement<{ children?: React.ReactNode }>).props.children
    return extractText(children)
  }
  return ''
}
