import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ToolbarActionId =
  | 'bold' | 'italic' | 'underline'
  | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol'
  | 'align-left' | 'align-center' | 'align-right' | 'align-justify'
  | 'link'

interface ToolbarButtonProps {
  icon: LucideIcon
  label: string
  actionId: ToolbarActionId
  onAction: (action: ToolbarActionId) => void
}

function ToolbarButton({ icon: Icon, label, actionId, onAction }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      tabIndex={0}
      onMouseDown={(e) => {
        // Prevent textarea from losing focus on click
        e.preventDefault()
        onAction(actionId)
      }}
      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
    >
      <Icon size={15} />
    </button>
  )
}

function Divider() {
  return <span className="w-px h-4 bg-border mx-0.5 shrink-0" aria-hidden="true" />
}

interface FormattingToolbarProps {
  onAction: (action: ToolbarActionId) => void
}

export function FormattingToolbar({ onAction }: FormattingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/30 flex-wrap"
    >
      {/* Inline formatting */}
      <ToolbarButton icon={Bold}      label="Bold"      actionId="bold"      onAction={onAction} />
      <ToolbarButton icon={Italic}    label="Italic"    actionId="italic"    onAction={onAction} />
      <ToolbarButton icon={Underline} label="Underline" actionId="underline" onAction={onAction} />

      <Divider />

      {/* Headings */}
      <ToolbarButton icon={Heading1} label="Heading 1" actionId="h1" onAction={onAction} />
      <ToolbarButton icon={Heading2} label="Heading 2" actionId="h2" onAction={onAction} />
      <ToolbarButton icon={Heading3} label="Heading 3" actionId="h3" onAction={onAction} />

      <Divider />

      {/* Lists */}
      <ToolbarButton icon={List}        label="Bullet list"   actionId="ul" onAction={onAction} />
      <ToolbarButton icon={ListOrdered} label="Numbered list" actionId="ol" onAction={onAction} />

      <Divider />

      {/* Alignment */}
      <ToolbarButton icon={AlignLeft}    label="Align left"    actionId="align-left"    onAction={onAction} />
      <ToolbarButton icon={AlignCenter}  label="Align center"  actionId="align-center"  onAction={onAction} />
      <ToolbarButton icon={AlignRight}   label="Align right"   actionId="align-right"   onAction={onAction} />
      <ToolbarButton icon={AlignJustify} label="Align justify" actionId="align-justify" onAction={onAction} />

      <Divider />

      {/* Link */}
      <ToolbarButton icon={Link} label="Insert link" actionId="link" onAction={onAction} />
    </div>
  )
}
