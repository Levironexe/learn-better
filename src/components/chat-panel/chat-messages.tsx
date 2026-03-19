'use client'

import { useEffect, useRef } from 'react'
import type { AppUIMessage } from '@/types/ai'

interface ChatMessagesProps {
  messages: AppUIMessage[]
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
        if (textParts.length === 0) return null
        const text = textParts.map((p) => p.type === 'text' ? p.text : '').join('')

        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-foreground'
              }`}
            >
              {text}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
