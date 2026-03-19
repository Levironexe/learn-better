'use client'

import type { AppUIMessage, ProposalState } from '@/types/ai'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ProposalBanner } from './proposal-banner'

interface ChatPanelProps {
  messages: AppUIMessage[]
  input: string
  onInputChange: (value: string) => void
  onSubmit: (text: string) => void
  isLoading: boolean
  error?: string | null
  pendingProposal?: ProposalState | null
  onAccept?: () => Promise<void>
  onDecline?: () => void
}

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  pendingProposal,
  onAccept,
  onDecline,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3  h-12 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Learning Assistant</h2>
      </div>
      <ChatMessages messages={messages} />
      {pendingProposal && onAccept && onDecline && (
        <ProposalBanner
          proposal={pendingProposal}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      )}
      {error && (
        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-900">
          Error: {error}
        </div>
      )}
      <ChatInput
        input={input}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
