import type { KeyboardEvent } from 'react'

// Accepts digits, one decimal separator, one leading minus and Ctrl/Cmd shortcuts.
export function isAllowedNumericKeystroke(e: KeyboardEvent, currentText: string): boolean {
  if (e.ctrlKey || e.metaKey) return true
  const sel = window.getSelection()
  const hasSelection = sel !== null && !sel.isCollapsed
  if (/^[0-9]$/.test(e.key)) return true
  if (e.key === '.' || e.key === ',') {
    const hasDecimal = currentText.includes('.') || currentText.includes(',')
    return !hasDecimal || hasSelection
  }
  // A minus is typeable at the start so validation can show the error for negative numbers.
  if (e.key === '-') {
    const atStart = sel ? sel.anchorOffset === 0 : currentText.length === 0
    return !currentText.includes('-') && atStart
  }
  return false
}
