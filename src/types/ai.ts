import type { UIMessage } from 'ai'
import type { LessonPlanContent } from '@/lib/ai/index'

// Custom data parts for the lesson plan update stream
export type LessonPlanDataParts = {
  'lesson-plan-update': {
    lessonPlanId: string
    title: string
    content: LessonPlanContent
  }
  'lesson-plan-proposal': {
    proposalId: string
    title: string
    content: LessonPlanContent
    mode: 'create' | 'edit'
    lessonPlanId?: string
  }
}

// Frontend state for a pending proposal awaiting user confirmation
export type ProposalState = {
  proposalId: string
  title: string
  content: LessonPlanContent
  mode: 'create' | 'edit'
  lessonPlanId?: string
}

// Extended UIMessage type with our custom data parts
export type AppUIMessage = UIMessage<never, LessonPlanDataParts>
