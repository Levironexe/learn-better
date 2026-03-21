import {
  streamText,
  generateObject,
  generateText,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
} from 'ai'
import type { UIMessage } from 'ai'
import {
  anthropic,
  IntentSchema,
  INTENT_SYSTEM_PROMPT,
  LessonPlanContentSchema,
  SYSTEM_PROMPT,
} from '@/lib/ai/index'
import { createBraveSearchTools } from '@/lib/ai/mcp'
import { getToolStatusLabel } from '@/lib/ai/tool-status'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { lesson_plans, lesson_sections, chat_messages } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type { LessonPlanDataParts } from '@/types/ai'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, lessonPlanId }: { messages: UIMessage[]; lessonPlanId?: string } = await req.json()

  if (!messages || messages.length === 0) {
    return new Response('messages array is required', { status: 400 })
  }

  if (lessonPlanId) {
    const existing = await db.query.lesson_plans.findFirst({
      where: and(eq(lesson_plans.id, lessonPlanId), eq(lesson_plans.user_id, user.id)),
    })
    if (!existing) {
      return new Response('Lesson plan not found', { status: 404 })
    }
  }

  const modelMessages = await convertToModelMessages(messages)

  const stream = createUIMessageStream<UIMessage<never, LessonPlanDataParts>>({
    execute: async ({ writer }) => {
      const emitStatus = (tool: string, status: 'running' | 'complete') => {
        writer.write({
          type: 'data-tool-status',
          data: { tool, status, label: getToolStatusLabel(tool) },
        })
      }

      // Phase 1: Intent detection
      emitStatus('classify_intent', 'running')
      const { object: { intent } } = await generateObject({
        model: anthropic('claude-haiku-4-5'),
        schema: IntentSchema,
        system: INTENT_SYSTEM_PROMPT,
        messages: modelMessages,
      })
      emitStatus('classify_intent', 'complete')

      // Phase 2: Lesson generation (create_lesson or edit_lesson)
      if (intent === 'create_lesson' || intent === 'edit_lesson') {
        let systemPrompt = SYSTEM_PROMPT
        let mode: 'create' | 'edit' = 'create'

        if (intent === 'edit_lesson') {
          if (!lessonPlanId) {
            // No active plan — skip generation, handle in conversational phase
          } else {
            mode = 'edit'
            // Fetch current sections to build edit context
            const sections = await db
              .select({
                title: lesson_sections.title,
                content_markdown: lesson_sections.content_markdown,
              })
              .from(lesson_sections)
              .where(eq(lesson_sections.lesson_plan_id, lessonPlanId))
              .orderBy(asc(lesson_sections.display_order))

            const currentPlanContext = sections
              .map((s) => `[${s.title}]:\n${s.content_markdown}`)
              .join('\n\n')

            systemPrompt = `${SYSTEM_PROMPT}

Current lesson plan sections:
<sections>
${currentPlanContext}
</sections>

Please update the lesson plan according to the user's edit request above. Preserve unchanged sections and incorporate the requested modifications.`
          }
        }

        if (intent === 'create_lesson' || (intent === 'edit_lesson' && lessonPlanId)) {
          // Optionally enrich with web search via MCP
          let enrichedSystem = systemPrompt
          const mcp = await createBraveSearchTools().catch((err) => {
            console.error('[MCP] Failed to create search tools:', err)
            return null
          })
          try {
            if (mcp && Object.keys(mcp.tools).length > 0) {
              emitStatus('brave_web_search', 'running')
              const searchResult = await generateText({
                model: anthropic('claude-haiku-4-5'),
                system: 'You are a research assistant. Use the available search tools to find current, relevant information about the topic the user wants to learn about. Summarize the most useful findings in 3-5 sentences.',
                messages: modelMessages,
                tools: mcp.tools,
                stopWhen: stepCountIs(3),
              })
              emitStatus('brave_web_search', 'complete')
              if (searchResult.text) {
                enrichedSystem = `${systemPrompt}\n\nRecent web search findings:\n${searchResult.text}`
              }
            }
          } finally {
            await mcp?.client.close().catch(() => undefined)
          }

          emitStatus('generate_lesson', 'running')
          const { object: content } = await generateObject({
            model: anthropic('claude-haiku-4-5'),
            schema: LessonPlanContentSchema,
            system: enrichedSystem,
            messages: modelMessages,
          })
          emitStatus('generate_lesson', 'complete')

          const title = content.sections[0]?.title ?? 'New Lesson Plan'
          const proposalId = crypto.randomUUID()

          writer.write({
            type: 'data-lesson-plan-proposal',
            data: {
              proposalId,
              title,
              content,
              mode,
              ...(mode === 'edit' && lessonPlanId ? { lessonPlanId } : {}),
            },
          })
        }
      }

      // Phase 3: Conversational reply (always)
      const lastUserMessage = messages[messages.length - 1]
      const userText = lastUserMessage?.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('') || '[message]'

      if (lessonPlanId) {
        await db.insert(chat_messages).values({
          lesson_plan_id: lessonPlanId,
          role: 'user',
          content: userText,
        })
      }

      const conversationalInstruction =
        intent === 'create_lesson'
          ? 'A lesson plan proposal has been generated and is awaiting user confirmation. Write a brief 2-3 sentence conversational preview of what was created.'
          : intent === 'edit_lesson' && !lessonPlanId
            ? 'The user wants to edit a lesson plan but no plan is currently active. Politely inform them they need to create or load a lesson plan first before requesting edits.'
            : intent === 'edit_lesson'
              ? 'An updated lesson plan proposal has been generated based on the user\'s edit request. Write a brief conversational summary of the changes proposed.'
              : 'Reply conversationally to the user\'s message. Keep it friendly and concise.'

      const result = streamText({
        model: anthropic('claude-haiku-4-5'),
        system: conversationalInstruction,
        messages: modelMessages,
        onFinish: async ({ text }) => {
          if (lessonPlanId) {
            await db.insert(chat_messages).values({
              lesson_plan_id: lessonPlanId,
              role: 'assistant',
              content: text,
            })
          }
        },
      })

      writer.merge(result.toUIMessageStream())
    },
  })

  return createUIMessageStreamResponse({ stream })
}
