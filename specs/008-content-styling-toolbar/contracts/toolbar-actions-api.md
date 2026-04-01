# Contract: Toolbar Actions API

**Feature**: 008-content-styling-toolbar
**Scope**: Internal UI contract — `src/lib/editor/toolbar-actions.ts`

## Overview

Each formatting action is a pure function with a consistent signature. This contract defines the interface between the `FormattingToolbar` component and the `toolbar-actions` utility module.

## Function Signature

```
applyFormat(action: ActionId, input: TransformInput): TransformResult
```

Or equivalently, one exported function per action:

```
applyBold(input: TransformInput): TransformResult
applyItalic(input: TransformInput): TransformResult
applyUnderline(input: TransformInput): TransformResult
applyH1(input: TransformInput): TransformResult
applyH2(input: TransformInput): TransformResult
applyH3(input: TransformInput): TransformResult
applyUnorderedList(input: TransformInput): TransformResult
applyOrderedList(input: TransformInput): TransformResult
applyAlignLeft(input: TransformInput): TransformResult
applyAlignCenter(input: TransformInput): TransformResult
applyAlignRight(input: TransformInput): TransformResult
applyAlignJustify(input: TransformInput): TransformResult
applyLink(input: TransformInput & { url: string }): TransformResult
```

## Input Contract

```typescript
type TransformInput = {
  value: string          // Full textarea content
  selectionStart: number // Selection start (0-indexed character offset)
  selectionEnd: number   // Selection end (0-indexed character offset)
}
```

**Invariants**:
- `0 <= selectionStart <= selectionEnd <= value.length`
- `selectionStart === selectionEnd` means no selection (cursor only)
- `value` may be empty string (`""`)

## Output Contract

```typescript
type TransformResult = {
  newValue: string          // Updated full textarea content
  newSelectionStart: number // Selection start to restore
  newSelectionEnd: number   // Selection end to restore
}
```

**Invariants**:
- `newValue.length >= 0`
- `0 <= newSelectionStart <= newSelectionEnd <= newValue.length`
- For inline toggle-off: `newValue.length === value.length - markers.length`
- For inline apply: `newValue.length === value.length + markers.length`

## Behavior Contracts

### Inline Actions (Bold, Italic, Underline)

| Condition | Behavior |
|-----------|----------|
| Selection exists, not formatted | Wrap selection with markers; select the inner text |
| Selection exists, already formatted | Remove markers; select inner text |
| No selection | Insert placeholder at cursor; select the placeholder inner text |

### Block Actions (H1, H2, H3, UL, OL)

| Condition | Behavior |
|-----------|----------|
| Cursor on unformatted line | Prefix the line with marker |
| Cursor on already-prefixed line | Remove the prefix (toggle) |
| Multiple lines selected | Apply/toggle prefix on each line independently |

### Alignment Actions (Center, Right, Justify)

| Condition | Behavior |
|-----------|----------|
| Line not wrapped | Wrap line(s) in `<div style="text-align: X">` |
| Line already wrapped in same alignment | Remove wrapper (toggle) |
| Line wrapped in different alignment | Replace existing wrapper |

### Align Left (special case)

Always removes any alignment wrapper. Idempotent on plain text.

### Link Action

Requires `url` field in addition to `TransformInput`.

| Condition | Behavior |
|-----------|----------|
| Selection exists | Output: `[selectedText](url)` |
| No selection | Output: `[link text](url)` with "link text" as placeholder |
| `url` is empty string | Return input unchanged (no-op) |

## Idempotency

All toggle actions are idempotent when applied twice:
- `applyBold(applyBold(input).newValue, ...)` returns the original value

## Side Effects

**None.** All functions are pure — no DOM access, no network calls, no global state mutation.
