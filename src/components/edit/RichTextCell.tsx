import { useRef, type KeyboardEvent } from 'react'
import type { RichTextDoc } from '../../document/richtext'
import { AstView } from './AstView'
import { getPlainText } from '../../document/richtext'

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
  onCommit: (plainText: string) => void
  onCancel?: () => void
}

export function RichTextCell({ text, onCommit, onCancel }: RichTextCellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const cancelling = useRef(false)

  const commit = () => {
    if (cancelling.current) {
      cancelling.current = false
      return
    }
    if (ref.current) {
      const plain = ref.current.textContent ?? ''
      // Skip no-op commits (history push would be wasted)
      if (plain !== getPlainText(text)) onCommit(plain)
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
      // Restore original text in DOM and cancel — don't commit
      cancelling.current = true
      if (ref.current) ref.current.textContent = getPlainText(text)
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
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={commit}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{ outline: 'none' }}
    >
      <AstView value={text} />
    </div>
  )
}
