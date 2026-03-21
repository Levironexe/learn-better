'use client'

import { useEffect, useRef } from 'react'
import type { AppUIMessage } from '@/types/ai'
import { StatusIndicator } from './status-indicator'

interface ChatMessagesProps {
  messages: AppUIMessage[]
}

function getActiveStatuses(msg: AppUIMessage): string[] {
  const statusMap = new Map<string, { status: string; label: string }>()
  for (const part of msg.parts) {
    if (part.type === 'data-tool-status') {
      statusMap.set(part.data.tool, { status: part.data.status, label: part.data.label })
    }
  }
  const active: string[] = []
  for (const [, value] of statusMap) {
    if (value.status === 'running') {
      active.push(value.label)
    }
  }
  return active
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4">
        What would you like to learn today?
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const textParts = msg.parts.filter((p) => p.type === 'text')
        const text = textParts.map((p) => p.type === 'text' ? p.text : '').join('')
        const activeStatuses = msg.role === 'assistant' ? getActiveStatuses(msg) : []
        const hasContent = text.length > 0 || activeStatuses.length > 0

        if (!hasContent) return null

        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[85%] space-y-1">
              {text && (
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {text}
                </div>
              )}
              {activeStatuses.map((label) => (
                <StatusIndicator key={label} label={label} />
              ))}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
