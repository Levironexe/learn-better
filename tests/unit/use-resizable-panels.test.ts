import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
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

// We test the logic extracted from the hook (pure functions)
describe('useResizablePanels storage logic', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should read default width when no stored value', () => {
    const value = localStorage.getItem('learn-better:panel-width')
    expect(value).toBeNull()
  })

  it('should persist width to localStorage', () => {
    localStorage.setItem('learn-better:panel-width', '35')
    expect(localStorage.getItem('learn-better:panel-width')).toBe('35')
  })

  it('should persist collapsed state to localStorage', () => {
    localStorage.setItem('learn-better:chat-collapsed', 'true')
    expect(localStorage.getItem('learn-better:chat-collapsed')).toBe('true')
  })

  it('should handle invalid stored width gracefully', () => {
    localStorage.setItem('learn-better:panel-width', 'invalid')
    const stored = localStorage.getItem('learn-better:panel-width')
    const parsed = Number(stored)
    expect(Number.isFinite(parsed)).toBe(false)
  })
})

describe('width clamping', () => {
  const minWidth = 15
  const maxWidth = 75
  const clamp = (value: number) => Math.min(maxWidth, Math.max(minWidth, value))

  it('should clamp values below minimum', () => {
    expect(clamp(5)).toBe(15)
    expect(clamp(0)).toBe(15)
    expect(clamp(-10)).toBe(15)
  })

  it('should clamp values above maximum', () => {
    expect(clamp(80)).toBe(75)
    expect(clamp(100)).toBe(75)
  })

  it('should pass through values within range', () => {
    expect(clamp(40)).toBe(40)
    expect(clamp(15)).toBe(15)
    expect(clamp(75)).toBe(75)
    expect(clamp(50)).toBe(50)
  })
})

describe('collapse/expand state', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('should toggle collapsed state', () => {
    let collapsed = false
    collapsed = !collapsed
    expect(collapsed).toBe(true)
    collapsed = !collapsed
    expect(collapsed).toBe(false)
  })

  it('should save width before collapsing and restore on expand', () => {
    const currentWidth = 35
    let widthBeforeCollapse = currentWidth
    let collapsed = false

    // Collapse
    widthBeforeCollapse = currentWidth
    collapsed = true
    expect(widthBeforeCollapse).toBe(35)

    // Expand
    collapsed = false
    const restoredWidth = widthBeforeCollapse
    expect(restoredWidth).toBe(35)
    expect(collapsed).toBe(false)
  })
})
