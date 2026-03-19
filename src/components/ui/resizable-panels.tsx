'use client'

import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useResizablePanels } from '@/hooks/use-resizable-panels'

interface ResizablePanelsProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultRightWidth?: number
  minRightWidth?: number
  maxRightWidth?: number
  storageKey?: string
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultRightWidth = 40,
  minRightWidth = 15,
  maxRightWidth = 75,
  storageKey = 'learn-better',
}: ResizablePanelsProps) {
  const { rightWidth, isCollapsed, isDragging, toggleCollapse, handleDragStart } =
    useResizablePanels({
      defaultWidth: defaultRightWidth,
      minWidth: minRightWidth,
      maxWidth: maxRightWidth,
      storageKey,
    })

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Left panel */}
      <div
        className={`flex flex-col overflow-hidden border-r border-border ${
          isDragging ? '' : 'transition-[flex-basis] duration-300 ease-in-out'
        }`}
        style={{ flexBasis: isCollapsed ? '100%' : `${100 - rightWidth}%`, flexShrink: 0 }}
      >
        {leftPanel}
      </div>

      {/* Drag handle + collapse toggle */}
      <div
        className={`relative shrink-0 flex flex-col items-center justify-center ${
          isDragging ? 'w-px bg-ring' : 'w-px hover:bg-ring'
        }`}
        style={{ cursor: isCollapsed ? 'default' : 'col-resize' }}
        onPointerDown={isCollapsed ? undefined : handleDragStart}
      >
        {/* Collapse/expand toggle button — vertically centered, 100% left of the bar */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapse() }}
          className="absolute right-full z-10 p-1.5 rounded-l-lg bg-background border border-border border-r-0 shadow-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label={isCollapsed ? 'Expand chat panel' : 'Collapse chat panel'}
          title={isCollapsed ? 'Expand chat panel' : 'Collapse chat panel'}
        >
          {isCollapsed ? (
            <PanelRightOpen size={18} />
          ) : (
            <PanelRightClose size={18} />
          )}
        </button>
      </div>

      {/* Right panel */}
      <div
        className={`flex flex-col overflow-hidden ${
          isDragging ? '' : 'transition-[flex-basis,opacity] duration-300 ease-in-out'
        }`}
        style={{
          flexBasis: isCollapsed ? '0%' : `${rightWidth}%`,
          flexShrink: 0,
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        {rightPanel}
      </div>
    </div>
  )
}
