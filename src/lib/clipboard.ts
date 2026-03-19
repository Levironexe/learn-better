/**
 * Copy text to the system clipboard.
 * Returns true on success, false on failure (never throws).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    console.error('Failed to copy to clipboard')
    return false
  }
}
