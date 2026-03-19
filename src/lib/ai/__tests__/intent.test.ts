import { describe, it, expect } from 'vitest'
import { IntentSchema, INTENT_SYSTEM_PROMPT } from '../index'

describe('IntentSchema', () => {
  it('parses conversational intent', () => {
    const result = IntentSchema.parse({ intent: 'conversational', rationale: 'greeting' })
    expect(result.intent).toBe('conversational')
    expect(result.rationale).toBe('greeting')
  })

  it('parses create_lesson intent', () => {
    const result = IntentSchema.parse({ intent: 'create_lesson', rationale: 'user wants to learn Python' })
    expect(result.intent).toBe('create_lesson')
  })

  it('parses edit_lesson intent', () => {
    const result = IntentSchema.parse({ intent: 'edit_lesson', rationale: 'user wants to add a section' })
    expect(result.intent).toBe('edit_lesson')
  })

  it('rejects unknown intent values', () => {
    expect(() => IntentSchema.parse({ intent: 'unknown', rationale: 'x' })).toThrow()
  })

  it('rejects missing rationale', () => {
    expect(() => IntentSchema.parse({ intent: 'conversational' })).toThrow()
  })
})

describe('INTENT_SYSTEM_PROMPT', () => {
  it('contains the three intent categories', () => {
    expect(INTENT_SYSTEM_PROMPT).toContain('conversational')
    expect(INTENT_SYSTEM_PROMPT).toContain('create_lesson')
    expect(INTENT_SYSTEM_PROMPT).toContain('edit_lesson')
  })

  it('instructs conservative classification', () => {
    expect(INTENT_SYSTEM_PROMPT.toLowerCase()).toContain('conservative')
  })
})

describe('edit_lesson intent classification', () => {
  it('accepts edit_lesson intent with rationale', () => {
    const result = IntentSchema.parse({
      intent: 'edit_lesson',
      rationale: 'User said "make the intro section shorter" with an active plan',
    })
    expect(result.intent).toBe('edit_lesson')
    expect(result.rationale).toBeTruthy()
  })

  it('distinguishes from create_lesson', () => {
    const createResult = IntentSchema.parse({ intent: 'create_lesson', rationale: 'fresh topic' })
    const editResult = IntentSchema.parse({ intent: 'edit_lesson', rationale: 'modify existing' })
    expect(createResult.intent).not.toBe(editResult.intent)
  })
})
