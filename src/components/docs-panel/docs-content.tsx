'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import type { Section } from '@/lib/ai/index'
import { copyToClipboard } from '@/lib/clipboard'
import { SectionEditor } from './section-editor'

interface DocsContentProps {
  section: Section
  planId: string | null
  onSectionSave: (sectionSlug: string, newContent: string) => void
  onSectionDelete: (sectionSlug: string) => void
}

export function DocsContent({ section, planId, onSectionSave, onSectionDelete }: DocsContentProps) {
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null)

  const initialContent = section.subsections
    .map((sub) => `## ${sub.title}\n\n${sub.body}`)
    .join('\n\n')

  const handleCopy = useCallback(async () => {
    const markdown = section.subsections
      .map((sub) => `## ${sub.title}\n\n${sub.body}`)
      .join('\n\n')
    const success = await copyToClipboard(`# ${section.title}\n\n${markdown}`)
    if (success) {
      setCopiedSectionId(section.id)
      setTimeout(() => setCopiedSectionId(null), 2000)
    }
  }, [section])

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 w-full">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">
          {section.title}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Copy section"
            title="Copy section"
          >
            {copiedSectionId === section.id ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {planId && section.dbId && (
            <SectionEditor
              planId={planId}
              sectionId={section.dbId}
              sectionSlug={section.id}
              initialContent={initialContent}
              onSave={(newContent: string) => onSectionSave(section.id, newContent)}
              onDelete={() => onSectionDelete(section.id)}
            />
          )}
        </div>
      </div>
      {section.subsections.map((sub) => (
        <div key={sub.id} id={sub.id} className="mb-8">
          <h3 className="text-base font-semibold text-foreground mb-3">
            {sub.title}
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {sub.body}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}
