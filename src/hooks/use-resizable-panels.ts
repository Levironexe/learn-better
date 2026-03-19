'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseResizablePanelsOptions {
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  storageKey?: string
}

interface UseResizablePanelsReturn {
  rightWidth: number
  isCollapsed: boolean
  isDragging: boolean
  toggleCollapse: () => void
  handleDragStart: (e: React.PointerEvent) => void
}

const STORAGE_WIDTH_KEY = (prefix: string) => `${prefix}:panel-width`
const STORAGE_COLLAPSED_KEY = (prefix: string) => `${prefix}:chat-collapsed`

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const stored = localStorage.getItem(key)
  if (stored === null) return fallback
  const parsed = Number(stored)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const stored = localStorage.getItem(key)
  if (stored === null) return fallback
  return stored === 'true'
}

export function useResizablePanels({
  defaultWidth = 40,
  minWidth = 15,
  maxWidth = 75,
  storageKey = 'learn-better',
}: UseResizablePanelsOptions = {}): UseResizablePanelsReturn {
  const [rightWidth, setRightWidth] = useState(() =>
    readStoredNumber(STORAGE_WIDTH_KEY(storageKey), defaultWidth)
  )
  const [isCollapsed, setIsCollapsed] = useState(() =>
    readStoredBoolean(STORAGE_COLLAPSED_KEY(storageKey), false)
  )
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLElement | null>(null)
  const widthBeforeCollapse = useRef(rightWidth)

  // Clamp width to min/max bounds
  const clamp = useCallback(
    (value: number) => Math.min(maxWidth, Math.max(minWidth, value)),
    [minWidth, maxWidth]
  )

  // Persist width changes
  useEffect(() => {
    localStorage.setItem(STORAGE_WIDTH_KEY(storageKey), String(rightWidth))
  }, [rightWidth, storageKey])

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem(STORAGE_COLLAPSED_KEY(storageKey), String(isCollapsed))
  }, [isCollapsed, storageKey])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      if (!prev) {
        // Collapsing — save current width
        widthBeforeCollapse.current = rightWidth
      } else {
        // Expanding — restore saved width
        setRightWidth(widthBeforeCollapse.current)
      }
      return !prev
    })
  }, [rightWidth])

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const container = (e.currentTarget as HTMLElement).parentElement
      if (!container) return
      containerRef.current = container

      setIsDragging(true)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      const onPointerMove = (ev: PointerEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const containerWidth = rect.width
        const offsetFromRight = rect.right - ev.clientX
        const percentage = (offsetFromRight / containerWidth) * 100
        setRightWidth(clamp(percentage))
      }

      const onPointerUp = () => {
        setIsDragging(false)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [clamp]
  )

  return { rightWidth, isCollapsed, isDragging, toggleCollapse, handleDragStart }
}
