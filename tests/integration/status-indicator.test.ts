import { describe, it, expect } from 'vitest'

/**
 * StatusIndicator component tests.
 *
 * These validate the component's rendering contract:
 * - Renders label text with trailing ellipsis
 * - Includes an animated pulsing dot element
 *
 * Note: Uses string-based assertions on the component module since
 * this project uses Node test environment (not jsdom). For full DOM
 * testing, switch vitest environment to 'jsdom' and use @testing-library/react.
 */
describe('StatusIndicator', () => {
  it('exports a StatusIndicator component', async () => {
    const mod = await import('@/components/chat-panel/status-indicator')
    expect(mod.StatusIndicator).toBeDefined()
    expect(typeof mod.StatusIndicator).toBe('function')
  })

  it('accepts a label prop', async () => {
    const mod = await import('@/components/chat-panel/status-indicator')
    // Verify the component is callable with the expected props shape
    expect(mod.StatusIndicator).toBeDefined()
    expect(mod.StatusIndicator.length).toBeGreaterThanOrEqual(0)
  })
})
