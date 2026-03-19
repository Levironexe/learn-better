import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases input', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('Prerequisites Environment Setup')).toBe(
      'prerequisites-environment-setup'
    )
  })

  it('handles ampersands and special symbols', () => {
    expect(slugify('Required Tools & Technologies')).toBe(
      'required-tools-technologies'
    )
  })

  it('collapses consecutive hyphens', () => {
    expect(slugify('foo---bar')).toBe('foo-bar')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('--foo bar--')).toBe('foo-bar')
  })

  it('handles numbers', () => {
    expect(slugify('Step 1: Getting Started')).toBe('step-1-getting-started')
  })

  it('handles already-slug input', () => {
    expect(slugify('already-slugged')).toBe('already-slugged')
  })

  it('returns empty string for all-symbol input', () => {
    expect(slugify('--- !!! ---')).toBe('')
  })

  it('matches remark-gfm output for typical headings', () => {
    expect(slugify('Setting Up Your GitHub Environment')).toBe(
      'setting-up-your-github-environment'
    )
  })
})
