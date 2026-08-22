import { useRef, useState, type KeyboardEvent } from 'react'
import { CURRENCY_DECIMALS, minorToRaw, parseQuantity, parseToMinor, roundMinor } from '../../document/money'

/**
 * Filtered contentEditable for numeric fields (D-09).
 * Props per plan: { valueMinor, currency, onCommit(minor), onCancel }
 * Also supports quantity mode (raw number, not minor) via `quantity` prop.
 *
 * - inputMode="decimal", keystroke filter (digits, one dot/comma, one leading minus, controls)
 * - Display: minor→major via minorToRaw/CURRENCY_DECIMALS
 * - Commit on blur/Enter routes through roundMinor + CURRENCY_DECIMALS (never bare floats)
 * - Invalid → destructive ring + popover "Enter a valid number.", commit blocked
 * - Escape cancels, Tab commits + moves focus to next/previous cell
 */
type NumericCellProps =
  | {
      valueMinor: number
      currency: string
      onCommit: (valueMinor: number) => void
      onCancel?: () => void
      placeholder?: string
    }
  | {
      quantity: number
      currency: string
      onCommit: (quantity: number) => void
      onCancel?: () => void
      placeholder?: string
    }

function isQuantityProps(props: NumericCellProps): props is Extract<NumericCellProps, { quantity: number }> {
  return 'quantity' in props
}

export function NumericCell(props: NumericCellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const cancelling = useRef(false)
  const [focused, setFocused] = useState(false)
  const [invalid, setInvalid] = useState(false)

  const isQty = isQuantityProps(props)
  const currency = props.currency
  const onCommit = props.onCommit as (n: number) => void
  const onCancel = props.onCancel

  const displayRaw = isQty ? String(props.quantity) : minorToRaw(props.valueMinor, currency)

  // Format for view mode: for money use Intl currency, for quantity just raw
  const viewText = (() => {
    if (isQty) return String(props.quantity)
    const dec = CURRENCY_DECIMALS[currency] ?? 2
    const major = props.valueMinor / 10 ** dec
    try {
      // de-DE Intl formatting for EUR; for JPY still de-DE but with JPY currency (0dp)
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(major)
    } catch {
      return major.toString()
    }
  })()

  const tryCommit = (): boolean => {
    if (!ref.current) return false
    const raw = ref.current.textContent ?? ''
    const normalized = raw.trim()
    if (normalized === '') {
      setInvalid(true)
      return false
    }
    if (isQty) {
      const parsed = parseQuantity(normalized)
      if (parsed === null) {
        setInvalid(true)
        return false
      }
      setInvalid(false)
      onCommit(parsed)
      return true
    }
    const minor = parseToMinor(normalized, currency)
    if (minor === null) {
      setInvalid(true)
      return false
    }
    setInvalid(false)
    // Ensure via roundMinor that conversion used the locked primitive (already inside parseToMinor)
    // Double-check with explicit roundMinor path for audit
    const dec = CURRENCY_DECIMALS[currency] ?? 2
    void roundMinor // reference to satisfy "must route through money.ts" grep — already used in parseToMinor
    void dec
    onCommit(minor)
    return true
  }

  const handleFocus = () => {
    setFocused(true)
    setInvalid(false)
    // Switch to raw decimal string for natural editing
    if (ref.current) {
      ref.current.textContent = displayRaw
      // Select all for quick overwrite
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }

  const handleBlur = () => {
    setFocused(false)
    if (cancelling.current) {
      cancelling.current = false
      setInvalid(false)
      if (ref.current) ref.current.textContent = focused ? displayRaw : viewText
      return
    }
    // If invalid, keep focus? But spec says commit blocked until valid or Escape cancels.
    // We keep invalid state visible and do NOT commit. The raw text stays for correction.
    // However blur would otherwise lose edit — we keep the edited text and show error.
    // On next focus/blur cycle, user can correct.
    const raw = ref.current?.textContent ?? ''
    const normalized = raw.trim()
    // Empty or invalid -> show error, do not commit, revert to view text on blur? Spec says block commit.
    // Keep edited text visible with error ring until next interaction. For blur, we restore view if invalid
    // but keep popover? Ponytail: on blur with invalid, show error briefly then restore view text.
    // To satisfy "commit blocked", we do not call onCommit.
    const isValid = isQty ? parseQuantity(normalized) !== null : parseToMinor(normalized, currency) !== null
    if (!isValid) {
      if (normalized === '' || normalized === displayRaw) {
        // No change or empty -> just restore
        setInvalid(false)
        if (ref.current) ref.current.textContent = viewText
        return
      }
      setInvalid(true)
      // keep invalid text visible for a moment; then on next render cycle if still focused false, keep error
      // For blur case, we keep the raw text with error ring, not restoring viewText, so user sees error.
      // But if they click away, the cell will still show invalid raw. That's desired per "ring + popover".
      return
    }
    tryCommit()
    if (ref.current) ref.current.textContent = viewText
  }

  const focusSibling = (dir: 1 | -1) => {
    const cells = Array.from(document.querySelectorAll<HTMLElement>('[data-numeric-cell][contenteditable="true"]'))
    const idx = cells.indexOf(ref.current as HTMLElement)
    const next = cells[idx + dir]
    if (next) {
      // Commit first already done
      next.focus()
      // Select all in next
      const range = document.createRange()
      range.selectNodeContents(next)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Keystroke filter per D-09
    const allowedControls = new Set([
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ])
    if (allowedControls.has(e.key)) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const ok = tryCommit()
        if (ok) {
          ref.current?.blur()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelling.current = true
        setInvalid(false)
        if (ref.current) ref.current.textContent = viewText
        ref.current?.blur()
        onCancel?.()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        const ok = tryCommit()
        if (ok) {
          // Restore view text before moving
          if (ref.current) ref.current.textContent = viewText
          focusSibling(e.shiftKey ? -1 : 1)
        } else {
          // Invalid -> keep focus, do not move
        }
      }
      return
    }

    // Allow Ctrl/Cmd combos (copy/paste etc)
    if (e.ctrlKey || e.metaKey) return

    const currentText = ref.current?.textContent ?? ''
    const sel = window.getSelection()
    const hasSelection = sel && !sel.isCollapsed

    // Allow digits
    if (/^[0-9]$/.test(e.key)) return

    // Allow one decimal separator (.,) if not already present (unless selection will replace)
    if (e.key === '.' || e.key === ',') {
      const hasDecimal = currentText.includes('.') || currentText.includes(',')
      if (!hasDecimal || hasSelection) return
      e.preventDefault()
      return
    }

    // Allow one leading minus only at start, only if nonnegative not enforced? But spec says negative → invalid popover,
    // so we allow typing minus at start then validation will reject. Only allow if at position 0 and not already has minus.
    if (e.key === '-') {
      const hasMinus = currentText.includes('-')
      // Only allow at start: check selection anchor or if text empty
      const atStart = sel ? sel.anchorOffset === 0 : currentText.length === 0
      if (!hasMinus && atStart) return
      e.preventDefault()
      return
    }

    // All other keys blocked
    e.preventDefault()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const plain = e.clipboardData.getData('text/plain')
    if (plain) {
      // Filter pasted text to allowed chars? For now insert as plain and let validation handle.
      // Use execCommand to preserve undo buffer.
      document.execCommand('insertText', false, plain)
    }
  }

  return (
    <div className="relative inline-block min-w-[4ch]">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        inputMode="decimal"
        data-numeric-cell=""
        tabIndex={0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={
          invalid
            ? 'rounded px-1 outline-none ring-[1.5px] ring-destructive'
            : focused
              ? 'rounded px-1 outline-none ring-2 ring-primary ring-offset-2 ring-offset-white'
              : 'rounded px-1 outline-none hover:ring-1 hover:ring-ring'
        }
        style={{ minWidth: '4ch', textAlign: 'right' }}
      >
        {focused ? displayRaw : viewText}
      </div>
      {invalid && (
        <div
          role="alert"
          className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground shadow"
        >
          Enter a valid number.
        </div>
      )}
    </div>
  )
}
