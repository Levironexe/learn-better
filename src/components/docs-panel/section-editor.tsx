'use client'

import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Pencil, Trash2 } from 'lucide-react'
import { FormattingToolbar } from './formatting-toolbar'
import type { ToolbarActionId } from './formatting-toolbar'
import {
  applyBold,
  applyItalic,
  applyUnderline,
  applyH1,
  applyH2,
  applyH3,
  applyUnorderedList,
  applyOrderedList,
  applyAlignLeft,
  applyAlignCenter,
  applyAlignRight,
  applyAlignJustify,
  applyLink,
} from '@/lib/editor/toolbar-actions'
import type { TransformResult } from '@/lib/editor/toolbar-actions'

interface SectionEditorProps {
  planId: string
  sectionId: string
  sectionSlug: string
  initialContent: string
  onSave: (newContent: string) => void
  onDelete: () => void
}

type EditorState = 'idle' | 'editing' | 'saving' | 'deleting' | 'error'

export function SectionEditor({ planId, sectionId, initialContent, onSave, onDelete }: SectionEditorProps) {
  const [state, setState] = useState<EditorState>('idle')
  const [draft, setDraft] = useState(initialContent)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleEdit = () => {
    setDraft(initialContent)
    setError(null)
    setState('editing')
  }

  const handleCancel = () => {
    setDraft(initialContent)
    setError(null)
    setState('idle')
  }

  const handleSave = async () => {
    setState('saving')
    setError(null)
    try {
      const res = await fetch(`/api/lesson-plans/${planId}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_markdown: draft }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message ?? `Save failed (${res.status})`)
      }
      onSave(draft)
      setState('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed. Please try again.')
      setState('error')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return
    setState('deleting')
    try {
      const res = await fetch(`/api/lesson-plans/${planId}/sections/${sectionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
      onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed. Please try again.')
      setState('idle')
    }
  }

  const applyTransform = useCallback((result: TransformResult) => {
    setDraft(result.newValue)
    if (state === 'error') setState('editing')
    // Restore selection after React re-renders the textarea value
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(result.newSelectionStart, result.newSelectionEnd)
      textareaRef.current?.focus()
    })
  }, [state])

  const handleToolbarAction = useCallback((action: ToolbarActionId) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const input = {
      value: draft,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    }

    switch (action) {
      case 'bold':         return applyTransform(applyBold(input))
      case 'italic':       return applyTransform(applyItalic(input))
      case 'underline':    return applyTransform(applyUnderline(input))
      case 'h1':           return applyTransform(applyH1(input))
      case 'h2':           return applyTransform(applyH2(input))
      case 'h3':           return applyTransform(applyH3(input))
      case 'ul':           return applyTransform(applyUnorderedList(input))
      case 'ol':           return applyTransform(applyOrderedList(input))
      case 'align-left':   return applyTransform(applyAlignLeft(input))
      case 'align-center': return applyTransform(applyAlignCenter(input))
      case 'align-right':  return applyTransform(applyAlignRight(input))
      case 'align-justify':return applyTransform(applyAlignJustify(input))
      case 'link': {
        const rawUrl = window.prompt('Enter URL:') ?? ''
        if (!rawUrl) return
        const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
        return applyTransform(applyLink({ ...input, url }))
      }
    }
  }, [draft, applyTransform])

  if (state === 'idle' || state === 'deleting') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleEdit}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Edit section"
          title="Edit section"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={handleDelete}
          disabled={state === 'deleting'}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="Delete section"
          title="Delete section"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )
  }

  // editing / saving / error states
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium text-foreground">Edit section</span>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-destructive mr-2">{error}</span>
          )}
          <button
            onClick={handleCancel}
            className="text-xs px-3 py-1.5 rounded-xl border border-border text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={state === 'saving'}
            className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {state === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <FormattingToolbar onAction={handleToolbarAction} />

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            if (state === 'error') setState('editing')
          }}
          className="flex-1 resize-none p-6 font-mono text-sm bg-background text-foreground border-r border-border focus:outline-none"
          spellCheck={false}
        />
        <div className="flex-1 overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
