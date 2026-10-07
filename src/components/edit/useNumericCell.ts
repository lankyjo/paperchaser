import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { CURRENCY_DECIMALS, minorToRaw, parseQuantity, parseToMinor } from '../../document/money'
import { isAllowedNumericKeystroke } from './isAllowedNumericKeystroke'
import { selectContents } from './selectContents'

export type NumericCellProps =
  | { valueMinor: number; currency: string; onCommit: (valueMinor: number) => void; onCancel?: () => void; placeholder?: string }
  | { quantity: number; currency: string; onCommit: (quantity: number) => void; onCancel?: () => void; placeholder?: string }

const CONTROL_KEYS = new Set(['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])

function formatMoney(valueMinor: number, currency: string): string {
  const major = valueMinor / 10 ** (CURRENCY_DECIMALS[currency] ?? 2)
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(major)
  } catch {
    return major.toString()
  }
}

function focusSiblingCell(from: HTMLElement | null, dir: 1 | -1) {
  const cells = Array.from(document.querySelectorAll<HTMLElement>('[data-numeric-cell][contenteditable="true"]'))
  const next = cells[cells.indexOf(from as HTMLElement) + dir]
  if (next) {
    next.focus()
    selectContents(next)
  }
}

// Edit state for a numeric contentEditable: raw text while focused, formatted text otherwise.
export function useNumericCell(props: NumericCellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const cancelling = useRef(false)
  const [focused, setFocused] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const isQty = 'quantity' in props
  const { currency, onCancel } = props
  const onCommit = props.onCommit as (n: number) => void
  const displayRaw = isQty ? String(props.quantity) : minorToRaw(props.valueMinor, currency)
  const viewText = isQty ? String(props.quantity) : formatMoney(props.valueMinor, currency)
  const parse = (raw: string) => (isQty ? parseQuantity(raw.trim()) : parseToMinor(raw.trim(), currency))
  const showText = (text: string) => {
    if (ref.current) ref.current.textContent = text
  }

  const tryCommit = (): boolean => {
    if (!ref.current) return false
    const parsed = parse(ref.current.textContent ?? '')
    setInvalid(parsed === null)
    if (parsed !== null) onCommit(parsed)
    return parsed !== null
  }

  const handleFocus = () => {
    setFocused(true)
    setInvalid(false)
    if (ref.current) {
      ref.current.textContent = displayRaw
      selectContents(ref.current)
    }
  }

  // Invalid edits block the commit and stay visible with the error; unchanged or empty edits just revert.
  const handleBlur = () => {
    setFocused(false)
    const normalized = (ref.current?.textContent ?? '').trim()
    if (cancelling.current) {
      cancelling.current = false
      setInvalid(false)
      showText(focused ? displayRaw : viewText)
    } else if (parse(normalized) !== null) {
      tryCommit()
      showText(viewText)
    } else if (normalized === '' || normalized === displayRaw) {
      setInvalid(false)
      showText(viewText)
    } else {
      setInvalid(true)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (tryCommit()) ref.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelling.current = true
      setInvalid(false)
      showText(viewText)
      ref.current?.blur()
      onCancel?.()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (tryCommit()) {
        showText(viewText)
        focusSiblingCell(ref.current, e.shiftKey ? -1 : 1)
      }
    } else if (!CONTROL_KEYS.has(e.key) && !isAllowedNumericKeystroke(e, ref.current?.textContent ?? '')) {
      e.preventDefault()
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    const plain = e.clipboardData.getData('text/plain')
    // execCommand keeps the browser undo stack intact; validation handles bad pasted text.
    if (plain) document.execCommand('insertText', false, plain)
  }

  return { ref, focused, invalid, displayRaw, viewText, handleFocus, handleBlur, handleKeyDown, handlePaste }
}
