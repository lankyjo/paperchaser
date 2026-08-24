import { useState } from 'react'
import { Bold, Italic, Underline, List, Link as LinkIcon, Link2Off, X } from 'lucide-react'
import { useMountEffect } from '../../lib/useMountEffect'

/**
 * Mobile formatting footer — G-04-16 optional mobile footer for discoverability.
 * Shown on <1024px when any contentEditable cell is focused. Sticky bottom, safe-area,
 * 44×44 touch targets, print:hidden, lg:hidden so desktop uses floating toolbar only.
 */
export function MobileFormattingFooter() {
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState({ bold: false, italic: false, underline: false, list: false, link: false })

  useMountEffect(() => {
    const check = () => {
      const ae = document.activeElement as HTMLElement | null
      const isCell = ae !== null && ae.getAttribute('contenteditable') === 'true'
      setVisible(isCell)
      if (isCell) {
        setActive({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          list: document.queryCommandState('insertUnorderedList'),
          link: isSelectionInLink(),
        })
      }
    }

    document.addEventListener('focusin', check)
    document.addEventListener('focusout', () => setTimeout(check, 0))
    document.addEventListener('selectionchange', check)
    document.addEventListener('keyup', check)
    document.addEventListener('mouseup', check)
    check()
    return () => {
      document.removeEventListener('focusin', check)
      document.removeEventListener('focusout', check as EventListener)
      document.removeEventListener('selectionchange', check)
      document.removeEventListener('keyup', check)
      document.removeEventListener('mouseup', check)
    }
  })

  if (!visible) return null

  const btnClass = (isActive: boolean) =>
    `flex size-11 items-center justify-center rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-foreground/10'}`

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    // Keep focus
    const ae = document.activeElement as HTMLElement | null
    ae?.focus()
  }

  const handleLink = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    if (active.link) {
      exec('unlink')
      return
    }
    const href = window.prompt('Enter URL (http, https, or mailto):', 'https://')
    if (href === null || href.trim() === '') return
    if (!/^(https?|mailto):/i.test(href.trim())) {
      window.alert('Link must start with http://, https://, or mailto:')
      return
    }
    exec('createLink', href.trim())
  }

  const dismiss = () => {
    const ae = document.activeElement as HTMLElement | null
    ae?.blur()
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-1 border-t bg-popover p-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] print:hidden lg:hidden">
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Bold" className={btnClass(active.bold)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
          <Bold className="size-5" />
        </button>
        <button type="button" aria-label="Italic" className={btnClass(active.italic)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}>
          <Italic className="size-5" />
        </button>
        <button type="button" aria-label="Underline" className={btnClass(active.underline)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}>
          <Underline className="size-5" />
        </button>
        <button type="button" aria-label="Bulleted list" className={btnClass(active.list)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          <List className="size-5" />
        </button>
        <button type="button" aria-label={active.link ? 'Remove link' : 'Add link'} className={btnClass(active.link)} onMouseDown={(e) => e.preventDefault()} onClick={handleLink}>
          {active.link ? <Link2Off className="size-5" /> : <LinkIcon className="size-5" />}
        </button>
      </div>
      <button
        type="button"
        aria-label="Done editing"
        className="flex h-11 items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        onMouseDown={(e) => e.preventDefault()}
        onClick={dismiss}
      >
        <X className="size-4" />
        Done
      </button>
    </div>
  )
}

function isSelectionInLink(): boolean {
  const sel = window.getSelection()
  const node = sel?.anchorNode
  if (!node) return false
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
  return el?.closest('a') !== null
}
