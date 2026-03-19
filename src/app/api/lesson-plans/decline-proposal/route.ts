import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DeclineProposalSchema = z.object({
  proposalId: z.string(),
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

  const parsed = DeclineProposalSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  // Decline is a client-side action — no DB write required
  return new Response(null, { status: 204 })
}
