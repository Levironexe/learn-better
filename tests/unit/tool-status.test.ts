import { describe, it, expect } from 'vitest'
import { getToolStatusLabel } from '@/lib/ai/tool-status'

describe('getToolStatusLabel', () => {
  it('returns correct label for brave_web_search', () => {
    expect(getToolStatusLabel('brave_web_search')).toBe('Searching the web')
  })

  it('returns correct label for generate_lesson', () => {
    expect(getToolStatusLabel('generate_lesson')).toBe('Generating lesson')
  })

  it('returns correct label for classify_intent', () => {
    expect(getToolStatusLabel('classify_intent')).toBe('Understanding your request')
  })

  it('returns fallback label for unknown tool name', () => {
    expect(getToolStatusLabel('unknown_new_tool')).toBe('Processing (unknown_new_tool)')
  })

  it('returns fallback label for empty string', () => {
    expect(getToolStatusLabel('')).toBe('Processing ()')
  })
})
