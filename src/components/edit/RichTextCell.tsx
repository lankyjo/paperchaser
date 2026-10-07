import { useRef, useState, type KeyboardEvent } from 'react'
import type { RichTextDoc } from '../../document/richtext'
import { AstView } from './AstView'
import { domToAst, getPlainText } from '../../document/richtext'
import { FloatingToolbar } from './FloatingToolbar'

// Uncontrolled contentEditable cell that commits on blur or Enter and cancels on Escape.

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
      // Defer to next frame so execCommand DOM (list/link wrapping) settles before React reconcile
      const el = ref.current
      requestAnimationFrame(() => {
        try {
          const doc = domToAst(el)
          const plainNow = getPlainText(doc)
          const plainPrev = getPlainText(text)
          const astPrev =
            typeof text === 'string' ? [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text }] }] : text
          const isSame = plainNow === plainPrev && JSON.stringify(doc) === JSON.stringify(astPrev)
          if (!isSame) onCommit(doc)
        } catch {
          // execCommand can leave partial DOM that domToAst rejects; keep the previous model rather than crash.
        }
      })
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit()
      ref.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelling.current = true
      // Restore the text now so the cancel is visible before the keyed parent remounts the cell.
      if (ref.current) {
        ref.current.textContent = getPlainText(text)
      }
      ref.current?.blur()
      onCancel?.()
    }
  }

  // Paste as plain text only so no foreign HTML enters the contentEditable.
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const plain = e.clipboardData.getData('text/plain')
    if (plain) {
      // execCommand keeps the browser undo stack intact.
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
        {/* Empty text renders no children so the :empty placeholder shows and the cell stays clickable. */}
        {!isEmpty && <AstView value={text} />}
      </div>
      {focused && <FloatingToolbar targetRef={ref} />}
    </>
  )
}
