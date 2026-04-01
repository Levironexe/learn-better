export type TransformInput = {
  value: string
  selectionStart: number
  selectionEnd: number
}

export type TransformResult = {
  newValue: string
  newSelectionStart: number
  newSelectionEnd: number
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Wraps or unwraps selected text with open/close markers.
 * - With selection: wraps; if already wrapped, unwraps (toggle).
 * - Without selection: inserts `openMarker + placeholder + closeMarker` at cursor.
 */
function wrapOrUnwrap(
  input: TransformInput,
  openMarker: string,
  closeMarker: string,
  placeholder: string,
): TransformResult {
  const { value, selectionStart, selectionEnd } = input
  const selected = value.slice(selectionStart, selectionEnd)

  if (selectionStart === selectionEnd) {
    // No selection — insert placeholder
    const insertion = openMarker + placeholder + closeMarker
    const newValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)
    return {
      newValue,
      newSelectionStart: selectionStart + openMarker.length,
      newSelectionEnd: selectionStart + openMarker.length + placeholder.length,
    }
  }

  // Toggle: if already wrapped, unwrap
  if (selected.startsWith(openMarker) && selected.endsWith(closeMarker)) {
    const inner = selected.slice(openMarker.length, selected.length - closeMarker.length)
    const newValue = value.slice(0, selectionStart) + inner + value.slice(selectionEnd)
    return {
      newValue,
      newSelectionStart: selectionStart,
      newSelectionEnd: selectionStart + inner.length,
    }
  }

  // Wrap selection
  const newValue = value.slice(0, selectionStart) + openMarker + selected + closeMarker + value.slice(selectionEnd)
  return {
    newValue,
    newSelectionStart: selectionStart + openMarker.length,
    newSelectionEnd: selectionStart + openMarker.length + selected.length,
  }
}

/**
 * Prefixes (or un-prefixes) every line touched by the selection with `prefix`.
 * If ALL touched lines already start with the prefix, removes it (toggle).
 */
function prefixLines(input: TransformInput, prefix: string): TransformResult {
  const { value, selectionStart, selectionEnd } = input

  // Find the start of the first line in the selection
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
  // Find the end of the last line in the selection
  const lineEnd = selectionEnd === value.length
    ? selectionEnd
    : (value.indexOf('\n', selectionEnd - 1) + 1 || value.length)

  const beforeLines = value.slice(0, lineStart)
  const linesBlock = value.slice(lineStart, lineEnd)
  const afterLines = value.slice(lineEnd)

  const lines = linesBlock.split('\n')
  // Remove trailing empty element if block ended with \n
  const trailingNewline = linesBlock.endsWith('\n')
  const workLines = trailingNewline ? lines.slice(0, -1) : lines

  const allPrefixed = workLines.every((l) => l.startsWith(prefix))

  const transformed = workLines.map((l) =>
    allPrefixed ? l.slice(prefix.length) : prefix + l
  )
  const newBlock = transformed.join('\n') + (trailingNewline ? '\n' : '')

  const newValue = beforeLines + newBlock + afterLines
  const delta = newBlock.length - linesBlock.length
  return {
    newValue,
    newSelectionStart: lineStart,
    newSelectionEnd: lineEnd + delta,
  }
}

/**
 * Wraps or replaces the alignment `<div>` wrapper on the touched lines.
 * `direction === 'left'` always removes any alignment wrapper.
 */
function wrapAlignment(input: TransformInput, direction: 'left' | 'center' | 'right' | 'justify'): TransformResult {
  const { value, selectionStart, selectionEnd } = input

  // Find the start of the first line
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
  // Find the end of the last touched line (inclusive of \n)
  let lineEnd = value.indexOf('\n', selectionEnd)
  lineEnd = lineEnd === -1 ? value.length : lineEnd + 1

  const beforeLines = value.slice(0, lineStart)
  const linesBlock = value.slice(lineStart, lineEnd)
  const afterLines = value.slice(lineEnd)

  // Check if block is already wrapped in an alignment div
  const alignRegex = /^<div style="text-align: (left|center|right|justify)">\n([\s\S]*?)\n<\/div>\n?$/
  const match = linesBlock.match(alignRegex)

  if (direction === 'left') {
    // Remove any existing wrapper
    const unwrapped = match ? match[2] + '\n' : linesBlock
    const newValue = beforeLines + unwrapped + afterLines
    return {
      newValue,
      newSelectionStart: lineStart,
      newSelectionEnd: lineStart + unwrapped.length,
    }
  }

  if (match) {
    if (match[1] === direction) {
      // Same direction — toggle off
      const unwrapped = match[2] + '\n'
      const newValue = beforeLines + unwrapped + afterLines
      return {
        newValue,
        newSelectionStart: lineStart,
        newSelectionEnd: lineStart + unwrapped.length,
      }
    }
    // Different direction — replace
    const inner = match[2]
    const wrapped = `<div style="text-align: ${direction}">\n${inner}\n</div>\n`
    const newValue = beforeLines + wrapped + afterLines
    return {
      newValue,
      newSelectionStart: lineStart,
      newSelectionEnd: lineStart + wrapped.length,
    }
  }

  // No existing wrapper — wrap the block
  const content = linesBlock.endsWith('\n') ? linesBlock.slice(0, -1) : linesBlock
  const wrapped = `<div style="text-align: ${direction}">\n${content}\n</div>\n`
  const newValue = beforeLines + wrapped + afterLines
  return {
    newValue,
    newSelectionStart: lineStart,
    newSelectionEnd: lineStart + wrapped.length,
  }
}

// ─── Inline formatting ────────────────────────────────────────────────────────

export function applyBold(input: TransformInput): TransformResult {
  return wrapOrUnwrap(input, '**', '**', 'bold text')
}

export function applyItalic(input: TransformInput): TransformResult {
  return wrapOrUnwrap(input, '*', '*', 'italic text')
}

export function applyUnderline(input: TransformInput): TransformResult {
  return wrapOrUnwrap(input, '<u>', '</u>', 'underline text')
}

// ─── Block formatting ─────────────────────────────────────────────────────────

export function applyH1(input: TransformInput): TransformResult {
  return prefixLines(input, '# ')
}

export function applyH2(input: TransformInput): TransformResult {
  return prefixLines(input, '## ')
}

export function applyH3(input: TransformInput): TransformResult {
  return prefixLines(input, '### ')
}

export function applyUnorderedList(input: TransformInput): TransformResult {
  return prefixLines(input, '- ')
}

export function applyOrderedList(input: TransformInput): TransformResult {
  return prefixLines(input, '1. ')
}

// ─── Alignment ────────────────────────────────────────────────────────────────

export function applyAlignLeft(input: TransformInput): TransformResult {
  return wrapAlignment(input, 'left')
}

export function applyAlignCenter(input: TransformInput): TransformResult {
  return wrapAlignment(input, 'center')
}

export function applyAlignRight(input: TransformInput): TransformResult {
  return wrapAlignment(input, 'right')
}

export function applyAlignJustify(input: TransformInput): TransformResult {
  return wrapAlignment(input, 'justify')
}

// ─── Link ─────────────────────────────────────────────────────────────────────

export function applyLink(input: TransformInput & { url: string }): TransformResult {
  const { value, selectionStart, selectionEnd, url } = input
  if (!url) return { newValue: value, newSelectionStart: selectionStart, newSelectionEnd: selectionEnd }

  const selected = value.slice(selectionStart, selectionEnd)
  const linkText = selected || 'link text'
  const insertion = `[${linkText}](${url})`
  const newValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)
  return {
    newValue,
    newSelectionStart: selectionStart,
    newSelectionEnd: selectionStart + insertion.length,
  }
}
