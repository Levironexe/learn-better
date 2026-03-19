import { test, expect } from '@playwright/test'

/**
 * Integration tests for US1: Chat Scoped to a Lesson Plan.
 *
 * These tests verify that GET /api/lesson-plans/[id] returns the full
 * lesson plan hierarchy (sections + items) so that chat sessions can
 * resolve the complete plan structure.
 *
 * Prerequisites: a running dev server with a seeded Supabase test DB.
 * Auth note: tests that require authentication use a pre-seeded session
 * cookie or expect a 401 when unauthenticated.
 */

test.describe('GET /api/lesson-plans/[id] — hierarchy response', () => {
  test('returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get('/api/lesson-plans/00000000-0000-0000-0000-000000000001')
    expect(res.status()).toBe(401)
  })

  test('returns 404 for unknown plan ID when authenticated', async ({ request }) => {
    // This test relies on a valid session being set up in Playwright config.
    // Skip if no auth setup is available in the test environment.
    test.skip(
      !process.env.TEST_AUTH_TOKEN,
      'Requires TEST_AUTH_TOKEN env var pointing to a seeded test session'
    )
    const res = await request.get(
      '/api/lesson-plans/00000000-0000-0000-0000-000000000099',
      { headers: { Cookie: `${process.env.TEST_AUTH_TOKEN}` } }
    )
    expect(res.status()).toBe(404)
  })

  test('response shape includes sections array when authenticated', async ({ request }) => {
    test.skip(
      !process.env.TEST_PLAN_ID || !process.env.TEST_AUTH_TOKEN,
      'Requires TEST_PLAN_ID and TEST_AUTH_TOKEN env vars for seeded test data'
    )
    const res = await request.get(
      `/api/lesson-plans/${process.env.TEST_PLAN_ID}`,
      { headers: { Cookie: `${process.env.TEST_AUTH_TOKEN}` } }
    )
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('lessonPlan')
    expect(body.lessonPlan).toHaveProperty('sections')
    expect(Array.isArray(body.lessonPlan.sections)).toBe(true)

    // Each section must have items array
    for (const section of body.lessonPlan.sections) {
      expect(section).toHaveProperty('items')
      expect(Array.isArray(section.items)).toBe(true)
    }

    // Sections ordered by display_order ascending
    const orders = body.lessonPlan.sections.map((s: { displayOrder: number }) => s.displayOrder)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))

    expect(body).toHaveProperty('chatMessages')
  })
})
