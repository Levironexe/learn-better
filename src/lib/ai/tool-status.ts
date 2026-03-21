const TOOL_STATUS_LABELS: Record<string, string> = {
  brave_web_search: 'Searching the web',
  generate_lesson: 'Generating lesson',
  classify_intent: 'Understanding your request',
}

/**
 * Maps an internal tool name to a human-readable status label.
 *
 * To add a label for a new tool, add an entry to the TOOL_STATUS_LABELS map above.
 * Unknown tools automatically get a fallback label — no UI changes required.
 */
export function getToolStatusLabel(toolName: string): string {
  return TOOL_STATUS_LABELS[toolName] ?? `Processing (${toolName})`
}
