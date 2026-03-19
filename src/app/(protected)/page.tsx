'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useEffect, useCallback, useRef } from 'react'
import { DocsPanel } from '@/components/docs-panel/docs-panel'
import { ChatPanel } from '@/components/chat-panel/chat-panel'
import { LessonPlanList } from '@/components/lesson-plan-list'
import type { LessonPlanContent } from '@/lib/ai/index'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import type { AppUIMessage, ProposalState } from '@/types/ai'

interface PlanMeta {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export default function HomePage() {
  const [plans, setPlans] = useState<PlanMeta[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [activePlan, setActivePlan] = useState<(LessonPlanContent & { title?: string }) | null>(null)
  const [pendingProposal, setPendingProposal] = useState<ProposalState | null>(null)
  const [input, setInput] = useState('')
  const [isLoadingPlan, setIsLoadingPlan] = useState(false)
  const activePlanIdRef = useRef<string | null>(null)

  const { messages, sendMessage, status, setMessages } = useChat<AppUIMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ lessonPlanId: activePlanIdRef.current }),
    }),
    onError: (err) => console.error('Chat error:', err),
  })

  // Keep ref in sync for the transport body closure
  useEffect(() => {
    activePlanIdRef.current = activePlanId
  }, [activePlanId])

  // Load plan list on mount
  useEffect(() => {
    fetch('/api/lesson-plans')
      .then((r) => r.json())
      .then(({ lessonPlans }) => setPlans(lessonPlans ?? []))
      .catch(console.error)
  }, [])

  // Watch for lesson plan proposal parts in messages
  useEffect(() => {
    for (const msg of [...messages].reverse()) {
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts) {
        if (part.type === 'data-lesson-plan-proposal') {
          const { proposalId, title, content, mode, lessonPlanId } = part.data
          setPendingProposal({ proposalId, title, content, mode, lessonPlanId })
          return
        }
      }
    }
  }, [messages])

  const handleSendMessage = useCallback((text: string) => {
    setPendingProposal(null)
    sendMessage({ text })
  }, [sendMessage])

  const handleAccept = useCallback(async () => {
    if (!pendingProposal) return
    const res = await fetch('/api/lesson-plans/accept-proposal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: pendingProposal.title,
        content: pendingProposal.content,
        lessonPlanId: pendingProposal.lessonPlanId ?? null,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Request failed with status ${res.status}`)
    }
    const { lessonPlanId, title } = await res.json()
    setActivePlan({ ...pendingProposal.content, title })
    setActivePlanId(lessonPlanId)
    setPlans((prev) => {
      const exists = prev.find((p) => p.id === lessonPlanId)
      if (exists) {
        return prev.map((p) =>
          p.id === lessonPlanId ? { ...p, title, updatedAt: new Date().toISOString() } : p
        )
      }
      return [
        { id: lessonPlanId, title, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ...prev,
      ]
    })
    setPendingProposal(null)
  }, [pendingProposal])

  const handleDecline = useCallback(async () => {
    if (!pendingProposal) return
    fetch('/api/lesson-plans/decline-proposal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        proposalId: pendingProposal.proposalId,
        lessonPlanId: pendingProposal.lessonPlanId ?? null,
      }),
    }).catch(console.error)
    setPendingProposal(null)
  }, [pendingProposal])

  const handleSelectPlan = useCallback(async (id: string) => {
    if (id === activePlanId) return
    setIsLoadingPlan(true)
    try {
      const res = await fetch(`/api/lesson-plans/${id}`)
      if (!res.ok) throw new Error('Failed to load plan')
      const { lessonPlan, chatMessages } = await res.json()
      setActivePlanId(id)
      setActivePlan(
        lessonPlan.sections?.length > 0
          ? {
              title: lessonPlan.title,
              sections: lessonPlan.sections.map((s: {
                id: string; slug: string; title: string;
                items: { anchor_id: string; title: string; body_markdown: string }[]
              }) => ({
                id: s.slug,
                dbId: s.id,
                title: s.title,
                subsections: s.items.map((item) => ({
                  id: item.anchor_id,
                  title: item.title,
                  body: item.body_markdown,
                })),
              })),
            }
          : null
      )
      setMessages(
        chatMessages.map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          parts: [{ type: 'text' as const, text: m.content }],
        }))
      )
    } catch (err) {
      console.error('Failed to load lesson plan:', err)
    } finally {
      setIsLoadingPlan(false)
    }
  }, [activePlanId, setMessages])

  const handleSectionSave = useCallback((sectionSlug: string, newContent: string) => {
    setActivePlan((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionSlug
            ? {
                ...s,
                subsections: newContent
                  .split(/\n(?=## )/)
                  .filter(Boolean)
                  .map((block, i) => {
                    const lines = block.split('\n')
                    const title = lines[0].replace(/^## /, '').trim()
                    const body = lines.slice(1).join('\n').trim()
                    return { id: `${sectionSlug}-item-${i}`, title, body }
                  }),
              }
            : s
        ),
      }
    })
  }, [])

  const handleSectionDelete = useCallback((sectionSlug: string) => {
    setActivePlan((prev) => {
      if (!prev) return prev
      const remaining = prev.sections.filter((s) => s.id !== sectionSlug)
      return remaining.length > 0 ? { ...prev, sections: remaining } : null
    })
  }, [])

  const handleNewPlan = useCallback(() => {
    setActivePlanId(null)
    setActivePlan(null)
    setPendingProposal(null)
    setMessages([])
  }, [setMessages])

  const isLoading = status === 'submitted' || status === 'streaming'
  const chatError = status === 'error' ? 'Something went wrong. Please try again.' : null

  return (
    <ResizablePanels
      leftPanel={
        <>
          {plans.length > 0 && (
            <LessonPlanList
              plans={plans}
              activePlanId={activePlanId}
              onSelect={handleSelectPlan}
              onNew={handleNewPlan}
            />
          )}
          <DocsPanel
            lessonPlan={activePlan}
            isStreaming={isLoading && !activePlan}
            isLoadingPlan={isLoadingPlan}
            planId={activePlanId}
            onSectionSave={handleSectionSave}
            onSectionDelete={handleSectionDelete}
          />
        </>
      }
      rightPanel={
        <ChatPanel
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          error={chatError}
          pendingProposal={pendingProposal}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      }
    />
  )
}
