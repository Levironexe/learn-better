'use client'

import { useEffect, useState } from 'react'
import type { Section } from '@/lib/ai/index'

interface DocsSidebarProps {
  sections: Section[]
  activeSectionId?: string
  onSelectSection: (id: string) => void
}

export function DocsSidebar({ sections, activeSectionId, onSelectSection }: DocsSidebarProps) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)

  // Track active anchor via URL hash
  useEffect(() => {
    const sync = () => setActiveAnchor(window.location.hash.slice(1) || null)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  if (sections.length === 0) return null

  return (
    <nav className="w-56 shrink-0 overflow-y-auto border-r border-border p-4">
      <ul className="space-y-1">
        {sections.map((section) => {
          const hasActiveChild = section.subsections.some((sub) => sub.id === activeAnchor)
          const isActive = section.id === activeSectionId || hasActiveChild
          return (
            <li key={section.id}>
              <div
                className={`w-full text-left text-sm font-semibold px-2 py-1.5 rounded ${
                  isActive
                    ? 'text-green-600  dark:text-green-500'
                    : 'text-foreground'
                }`}
              >
                {section.title}
              </div>
              {section.subsections.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-3">
                  {section.subsections.map((sub) => {
                    const isSubActive = activeAnchor === sub.id
                    return (
                      <li key={sub.id}>
                        <a
                          href={`#${sub.id}`}
                          onClick={() => onSelectSection(section.id)}
                          className={`block text-xs px-2 py-1 rounded transition-colors ${
                            isSubActive
                              ? 'bg-foreground/[0.07]  text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }`}
                        >
                          {sub.title}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
