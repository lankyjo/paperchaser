import { useRef, useState, type KeyboardEvent } from 'react'
import type { RichTextDoc } from '../../document/richtext'
import { AstView } from './AstView'
import { domToAst, getPlainText } from '../../document/richtext'
import { FloatingToolbar } from './FloatingToolbar'

/**
 * Uncontrolled contentEditable cell — plain text ONLY in the tracer
 * (Phase 04-02). Future plans add execCommand-based formatting.
 *
 * Contract (D-01, D-10, D-11):
 * - Props: { text, onCommit } — text is string | RichTextDoc (the shared field type).
 * - Renders the SAME AstView the view mode renders (one rendering path, D-11).
 * - Uncontrolled while focused — no re-render from model (prevents caret jumps).
 * - Commit on blur AND Enter (D-10).
 * - Escape cancels: parent remounts with key, restoring prior model value.
 * - NEVER uses dangerouslySetInnerHTML (CI-grep enforced).
 * - Paste strips to plain text (T-04-07: no rich HTML injection surface).
 */

interface RichTextCellProps {
  text: string | RichTextDoc
  onCommit: (next: RichTextDoc) => void
  onCancel?: () => void
  placeholder?: string
}

export function RichTextCell({ text, onCommit, onCancel, placeholder = 'Type here' }: RichTextCellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const cancelling = useRef(false)
  const [focused, setFocused] = useState(false)

  const isEmpty = getPlainText(text).trim().length === 0

  const commit = () => {
    setFocused(false)
    if (cancelling.current) {
      cancelling.current = false
      return
    }
    if (ref.current) {
      const doc = domToAst(ref.current)
      const plainNow = getPlainText(doc)
      const plainPrev = getPlainText(text)
      const astPrev =
        typeof text === 'string' ? [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text }] }] : text
      const isSame = plainNow === plainPrev && JSON.stringify(doc) === JSON.stringify(astPrev)
      if (!isSame) onCommit(doc)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit()
      // Blur to exit edit chrome after Enter commit (D-10)
      ref.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      // Restore original DOM and cancel — don't commit
      cancelling.current = true
      if (ref.current) {
        // Re-render AstView content by resetting text; the keyed parent will remount anyway
        // but we restore immediately for visual cancellation before blur
        ref.current.textContent = getPlainText(text)
      }
      ref.current?.blur()
      onCancel?.()
    }
  }

  // T-04-07: paste interceptor — strip to plain text to prevent
  // rich HTML injection through the contentEditable surface.
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const plain = e.clipboardData.getData('text/plain')
    if (plain) {
      // Use execCommand('insertText') to insert plain text at the caret
      // (deprecated but universally supported and preserves undo buffer).
      document.execCommand('insertText', false, plain)
    }
  }

  return (
    <>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={isEmpty ? placeholder : undefined}
        className={`edit-cell ${isEmpty ? 'is-empty' : ''}`}
        style={{ outline: 'none' }}
      >
        <AstView value={text} />
      </div>
      {focused && <FloatingToolbar targetRef={ref} />}
    </>
  )
}
