'use client'

import { useRef, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: (text: string) => void
  isLoading: boolean
}

export function ChatInput({ input, onInputChange, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSubmit(input.trim())
    onInputChange('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit(input.trim())
        onInputChange('')
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-border">
      <div className="flex items-center gap-2 border border-border bg-background rounded-full p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            onInputChange(e.target.value)
            autoResize()
          }}
          onKeyDown={onKeyDown}
          placeholder="Ask me to teach you something…"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 py-1 px-1 max-h-[120px]"
        />
        <button
          type="submit"
          disabled={!canSend}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-opacity ${
            canSend
              ? 'bg-foreground text-background opacity-100'
              : 'bg-foreground text-background opacity-30'
          }`}
          aria-label="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </form>
  )
}
