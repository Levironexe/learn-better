import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase auth
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock DB
vi.mock('@/lib/db/index', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'plan-uuid-1' }]) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
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
        { id: 'what-is', title: 'What is it?', body: 'Some markdown body' },
      ],
    },
  ],
}

async function importRoute() {
  const mod = await import('../route')
  return mod.POST
}

describe('POST /api/lesson-plans/accept-proposal', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never)

    const POST = await importRoute()
    const req = new Request('http://localhost/api/lesson-plans/accept-proposal', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: validContent }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when title is missing', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    } as never)

    const POST = await importRoute()
    const req = new Request('http://localhost/api/lesson-plans/accept-proposal', {
      method: 'POST',
      body: JSON.stringify({ content: validContent }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when content is invalid', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    } as never)

    const POST = await importRoute()
    const req = new Request('http://localhost/api/lesson-plans/accept-proposal', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: { sections: 'not-an-array' } }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with lessonPlanId and title on success (create mode)', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    } as never)

    const POST = await importRoute()
    const req = new Request('http://localhost/api/lesson-plans/accept-proposal', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Plan', content: validContent }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('lessonPlanId')
    expect(body).toHaveProperty('title', 'Test Plan')
  })
})
