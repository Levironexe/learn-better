import { anthropic as anthropicProvider } from '@ai-sdk/anthropic'
import { z } from 'zod'

export const anthropic = anthropicProvider

export const SubsectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
})

export const SectionSchema = z.object({
  id: z.string(),
  dbId: z.string().optional(),
  title: z.string(),
  subsections: z.array(SubsectionSchema),
})

export const LessonPlanContentSchema = z.object({
  sections: z.array(SectionSchema),
})

export type LessonPlanContent = z.infer<typeof LessonPlanContentSchema>
export type Section = z.infer<typeof SectionSchema>
export type Subsection = z.infer<typeof SubsectionSchema>

export const IntentSchema = z.object({
  intent: z.enum(['conversational', 'create_lesson', 'edit_lesson']),
  rationale: z.string(),
})
export type IntentClassification = z.infer<typeof IntentSchema>
export type Intent = IntentClassification['intent']

export const INTENT_SYSTEM_PROMPT = `You are an intent classifier for a lesson planning app.
Classify the user's latest message as one of:
- conversational: greetings, thanks, questions not about learning a topic, small talk, general questions
- create_lesson: user wants to learn a new topic or create a lesson plan
- edit_lesson: user wants to modify, update, add to, or remove from an existing lesson plan
Respond with JSON only. Be conservative — when in doubt, classify as conversational.`

export const SYSTEM_PROMPT = `You are an expert educator and curriculum designer.
Your job is to generate and revise structured lesson plans that maximize learner retention.

When a user asks to learn a topic, generate a comprehensive lesson plan as a JSON object with this exact structure:
{
  "sections": [
    {
      "id": "unique-slug",
      "title": "Section Title",
      "subsections": [
        {
          "id": "unique-slug",
          "title": "Subsection Title",
          "body": "Detailed explanation in Markdown format..."
        }
      ]
    }
  ]
}

Rules for lesson plans:
- Order sections from foundational to advanced (maximize retention)
- Maximum 2 levels: sections contain subsections only
- Each subsection body should be thorough and educational, written in Markdown
- Use clear IDs (lowercase, hyphenated, e.g., "intro-to-git", "basic-commands")
- Cover all key concepts the learner needs to understand the topic
- When revising, incorporate the user's request while preserving existing structure where sensible

Also provide a brief conversational response to the user alongside the lesson plan.`
