import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const EXISTING_PLAN_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const mockReturning = vi.fn().mockResolvedValue([{ id: EXISTING_PLAN_ID }])
const mockWhere = vi.fn().mockResolvedValue([])
const mockValues = vi.fn(() => ({ returning: mockReturning }))
const mockSet = vi.fn(() => ({ where: mockWhere }))

vi.mock('@/lib/db/index', () => ({
  db: {
    query: {
      lesson_plans: {
        findFirst: vi.fn().mockResolvedValue({ id: EXISTING_PLAN_ID, user_id: 'user-1', title: 'Old Title' }),
      },
    },
    insert: vi.fn(() => ({ values: mockValues })),
    update: vi.fn(() => ({ set: mockSet })),
    delete: vi.fn(() => ({ where: mockWhere })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  lesson_plans: {},
  lesson_sections: {},
  lesson_items: {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}))

const validContent = {
  sections: [
    {
      id: 'intro',
      title: 'Introduction',
      subsections: [
        { id: 'what-is', title: 'What is it?', body: 'Updated body content' },
      ],
    },
    {
      id: 'testing',
      title: 'Testing',
      subsections: [
        { id: 'unit-tests', title: 'Unit Tests', body: 'New section added by edit' },
      ],
    },
  ],
}

async function importRoute() {
  const mod = await import('../route')
  return mod.POST
}

describe('POST /api/lesson-plans/accept-proposal (edit mode)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('accepts an existing lessonPlanId for edit mode', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    } as never)

    const POST = await importRoute()
    const req = new Request('http://localhost/api/lesson-plans/accept-proposal', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Updated Plan',
        content: validContent,
        lessonPlanId: EXISTING_PLAN_ID,
      }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Updated Plan')
    expect(body).toHaveProperty('lessonPlanId')
  })

  it('returns 400 for invalid UUID in lessonPlanId', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    } as never)

    const POST = await importRoute()
    const req = new Request('http://localhost/api/lesson-plans/accept-proposal', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Updated Plan',
        content: validContent,
        lessonPlanId: 'not-a-uuid',
      }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
