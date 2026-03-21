import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('createBraveSearchTools', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns null when BRAVE_API_KEY is not set', async () => {
    delete process.env.BRAVE_API_KEY
    const { createBraveSearchTools } = await import('@/lib/ai/mcp')
    const result = await createBraveSearchTools()
    expect(result).toBeNull()
  })

  it('returns null when BRAVE_API_KEY is empty string', async () => {
    process.env.BRAVE_API_KEY = ''
    const { createBraveSearchTools } = await import('@/lib/ai/mcp')
    const result = await createBraveSearchTools()
    expect(result).toBeNull()
  })
})
