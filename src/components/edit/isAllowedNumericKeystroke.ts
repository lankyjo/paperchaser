import type { KeyboardEvent } from 'react'

// Accepts digits, separators, one leading minus and Ctrl/Cmd shortcuts.
export function isAllowedNumericKeystroke(e: KeyboardEvent, currentText: string): boolean {
  if (e.ctrlKey || e.metaKey) return true
  const sel = window.getSelection()
  if (/^[0-9]$/.test(e.key)) return true
  // Group and decimal separators of any locale; parsing decides whether the result is a valid number.
  if (e.key === '.' || e.key === ',' || e.key === ' ') return true
  // A minus is typeable at the start so validation can show the error for negative numbers.
  if (e.key === '-') {
    const atStart = sel ? sel.anchorOffset === 0 : currentText.length === 0
    return !currentText.includes('-') && atStart
  }
  return false
}
