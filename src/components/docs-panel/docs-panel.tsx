'use client'

import { useState } from 'react'
import type { LessonPlanContent } from '@/lib/ai/index'
import { SidebarSkeleton, ContentSkeleton } from '@/components/ui/skeleton'
import { DocsSidebar } from './docs-sidebar'
import { DocsContent } from './docs-content'

interface DocsPanelProps {
  lessonPlan: (LessonPlanContent & { title?: string }) | null
  isStreaming?: boolean
  isLoadingPlan?: boolean
  planId: string | null
  onSectionSave: (sectionSlug: string, newContent: string) => void
  onSectionDelete: (sectionSlug: string) => void
}

export function DocsPanel({ lessonPlan, isStreaming, isLoadingPlan, planId, onSectionSave, onSectionDelete }: DocsPanelProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // Skeleton loading state: loading from DB (not streaming from AI)
  if (isLoadingPlan) {
    return (
      <div className="flex-1 flex overflow-hidden">
        <nav className="w-56 shrink-0 overflow-y-auto border-r border-border">
          <SidebarSkeleton />
        </nav>
        <ContentSkeleton />
      </div>
    )
  }

  if (!lessonPlan || lessonPlan.sections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        {isStreaming ? (
          <span className="animate-pulse">Generating lesson plan…</span>
        ) : (
          <span>Ask the chatbot to create a lesson plan to get started.</span>
        )}
      </div>
    )
  }

  const activeSection =
    lessonPlan.sections.find((s) => s.id === activeSectionId) ?? lessonPlan.sections[0]

  return (
    <div className="flex-1 flex overflow-hidden">
      <DocsSidebar
        sections={lessonPlan.sections}
        activeSectionId={activeSection.id}
        onSelectSection={setActiveSectionId}
      />
      <DocsContent
        section={activeSection}
        planId={planId}
        onSectionSave={onSectionSave}
        onSectionDelete={onSectionDelete}
      />
    </div>
  )
}
