import { describe, it, expect, beforeEach, vi } from 'vitest'
import { copyToClipboard } from '@/lib/clipboard'

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return true when clipboard write succeeds', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })

    const result = await copyToClipboard('hello world')
    expect(result).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world')
  })

  it('should return false when clipboard write fails', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
      },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await copyToClipboard('hello world')
    expect(result).toBe(false)
    consoleSpy.mockRestore()
  })

  it('should pass the exact text to clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const markdown = '## Heading\n\nSome **bold** text\n- item 1\n- item 2'
    await copyToClipboard(markdown)
    expect(writeText).toHaveBeenCalledWith(markdown)
  })
})
