'use client'

import { useState } from 'react'
import type { ProposalState } from '@/types/ai'

interface ProposalBannerProps {
  proposal: ProposalState
  onAccept: () => Promise<void>
  onDecline: () => void
}

export function ProposalBanner({ proposal, onAccept, onDecline }: ProposalBannerProps) {
  const [state, setState] = useState<'idle' | 'accepting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const label = proposal.mode === 'edit'
    ? 'Apply these edits?'
    : 'Create this lesson plan?'

  async function handleAccept() {
    setState('accepting')
    setErrorMessage(null)
    try {
      await onAccept()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  return (
    <div className="mx-4 my-2 rounded-xl border border-border bg-muted/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{proposal.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDecline}
            disabled={state === 'accepting'}
            className="text-xs px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={state === 'accepting'}
            className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {state === 'accepting' ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving…
              </>
            ) : (
              'Accept'
            )}
          </button>
        </div>
      </div>
      {state === 'error' && errorMessage && (
        <p className="mt-2 text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  )
}
