interface StatusIndicatorProps {
  label: string
}

export function StatusIndicator({ label }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground/40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground/60" />
      </span>
      <span>{label}…</span>
    </div>
  )
}
