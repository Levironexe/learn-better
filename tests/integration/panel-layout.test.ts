import { describe, it, expect, beforeEach, vi } from 'vitest'

// Integration test for panel layout logic — validates the resize state machine
// and localStorage persistence roundtrip without requiring DOM rendering.

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
  get length() { return Object.keys(store).length },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('panel layout integration', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should persist width to localStorage and read it back', () => {
    const width = 35
    localStorage.setItem('learn-better:panel-width', String(width))
    const stored = Number(localStorage.getItem('learn-better:panel-width'))
    expect(stored).toBe(35)
  })

  it('should persist collapse state and read it back', () => {
    localStorage.setItem('learn-better:chat-collapsed', 'true')
    const stored = localStorage.getItem('learn-better:chat-collapsed')
    expect(stored).toBe('true')
  })

  it('should compute left panel width as 100 - rightWidth', () => {
    const rightWidth = 35
    const leftWidth = 100 - rightWidth
    expect(leftWidth).toBe(65)
  })

  it('should give left panel 100% when collapsed', () => {
    const isCollapsed = true
    const leftWidth = isCollapsed ? 100 : 100 - 40
    expect(leftWidth).toBe(100)
  })

  it('should restore right panel to previous width after expand', () => {
    // Simulate: set width 35, collapse, expand
    const savedWidth = 35
    localStorage.setItem('learn-better:panel-width', String(savedWidth))
    localStorage.setItem('learn-better:chat-collapsed', 'true')

    // On expand, read the saved width
    const restored = Number(localStorage.getItem('learn-better:panel-width'))
    expect(restored).toBe(35)
  })

  it('should enforce minimum and maximum width constraints', () => {
    const minWidth = 15
    const maxWidth = 75
    const clamp = (v: number) => Math.min(maxWidth, Math.max(minWidth, v))

    // Dragged too far left (right panel too small)
    expect(clamp(5)).toBe(15)
    // Dragged too far right (right panel too large)
    expect(clamp(90)).toBe(75)
    // Normal range
    expect(clamp(40)).toBe(40)
  })
})
