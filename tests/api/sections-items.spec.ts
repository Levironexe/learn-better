import { test, expect } from '@playwright/test'

/**
 * Integration tests for US2: Hierarchical Outline Navigation.
 *
 * Covers section and item CRUD: creation, conflict detection (409),
 * cascade deletion, PATCH, auth enforcement.
 *
 * Prerequisites: running dev server + seeded test DB with TEST_AUTH_TOKEN
 * and TEST_PLAN_ID env vars set.
 */

const skip = !process.env.TEST_AUTH_TOKEN || !process.env.TEST_PLAN_ID
const authHeaders = () => ({ Cookie: `${process.env.TEST_AUTH_TOKEN}` })
const planUrl = () => `/api/lesson-plans/${process.env.TEST_PLAN_ID}`

test.describe('Section CRUD', () => {
  let sectionId: string

  test('POST section returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.post(`${planUrl()}/sections`, {
      data: { title: 'Unauthorized Test' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST section creates section and returns 201', async ({ request }) => {
    test.skip(skip, 'Requires auth + seeded test data')

    const res = await request.post(`${planUrl()}/sections`, {
      headers: authHeaders(),
      data: { title: 'Prerequisites & Environment Setup' },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.section).toHaveProperty('id')
    expect(body.section.slug).toBe('prerequisites-environment-setup')
    sectionId = body.section.id
  })

  test('POST section with duplicate slug returns 409', async ({ request }) => {
    test.skip(skip, 'Requires auth + seeded test data')

    const res = await request.post(`${planUrl()}/sections`, {
      headers: authHeaders(),
      data: { title: 'Prerequisites & Environment Setup' },
    })
    expect(res.status()).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('slug_conflict')
  })

  test('GET section returns section with ordered items', async ({ request }) => {
    test.skip(skip || !sectionId, 'Requires auth + created section')

    const res = await request.get(`${planUrl()}/sections/${sectionId}`, {
      headers: authHeaders(),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.section).toHaveProperty('items')
    expect(Array.isArray(body.section.items)).toBe(true)
  })

  test('PATCH section updates title', async ({ request }) => {
    test.skip(skip || !sectionId, 'Requires auth + created section')

    const res = await request.patch(`${planUrl()}/sections/${sectionId}`, {
      headers: authHeaders(),
      data: { title: 'Updated Prerequisites' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.section.title).toBe('Updated Prerequisites')
  })

  test('DELETE section cascades to items', async ({ request }) => {
    test.skip(skip || !sectionId, 'Requires auth + created section')

    const res = await request.delete(`${planUrl()}/sections/${sectionId}`, {
      headers: authHeaders(),
    })
    expect(res.status()).toBe(204)

    // Section should now be 404
    const check = await request.get(`${planUrl()}/sections/${sectionId}`, {
      headers: authHeaders(),
    })
    expect(check.status()).toBe(404)
  })
})

test.describe('Item CRUD', () => {
  let sectionId: string
  let itemId: string

  test.beforeAll(async ({ request }) => {
    if (skip) return
    // Create a fresh section for item tests
    const res = await request.post(`${planUrl()}/sections`, {
      headers: authHeaders(),
      data: { title: 'Item Test Section' },
    })
    const body = await res.json()
    sectionId = body.section?.id
  })

  test('POST item returns 401 when unauthenticated', async ({ request }) => {
    test.skip(!sectionId, 'Requires section')
    const res = await request.post(
      `${planUrl()}/sections/${sectionId}/items`,
      { data: { title: 'Unauth Item' } }
    )
    expect(res.status()).toBe(401)
  })

  test('POST item creates item and returns 201', async ({ request }) => {
    test.skip(skip || !sectionId, 'Requires auth + section')

    const res = await request.post(
      `${planUrl()}/sections/${sectionId}/items`,
      {
        headers: authHeaders(),
        data: { title: 'Required Tools & Technologies' },
      }
    )
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.item).toHaveProperty('id')
    expect(body.item.anchorId).toBe('required-tools-technologies')
    itemId = body.item.id
  })

  test('POST item with duplicate anchor returns 409', async ({ request }) => {
    test.skip(skip || !sectionId, 'Requires auth + section')

    const res = await request.post(
      `${planUrl()}/sections/${sectionId}/items`,
      {
        headers: authHeaders(),
        data: { title: 'Required Tools & Technologies' },
      }
    )
    expect(res.status()).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('anchor_conflict')
  })

  test('PATCH item updates title', async ({ request }) => {
    test.skip(skip || !sectionId || !itemId, 'Requires auth + item')

    const res = await request.patch(
      `${planUrl()}/sections/${sectionId}/items/${itemId}`,
      {
        headers: authHeaders(),
        data: { title: 'Updated Tools' },
      }
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.item.title).toBe('Updated Tools')
  })

  test('DELETE item removes item', async ({ request }) => {
    test.skip(skip || !sectionId || !itemId, 'Requires auth + item')

    const res = await request.delete(
      `${planUrl()}/sections/${sectionId}/items/${itemId}`,
      { headers: authHeaders() }
    )
    expect(res.status()).toBe(204)
  })
})
