import { useRef, useState } from 'react'
import { Bold, Italic, Underline, List, Link as LinkIcon, Link2Off } from 'lucide-react'
import { useMountEffect } from '../../lib/useMountEffect'

/**
 * Floating formatting toolbar (04-03 Task 2) — shell overlay, never inside #print-root (D-04).
 *
 * Props: targetRef is the active RichTextCell's container element. Toolbar positions
 * 32px above the selection's bounding rect, centered, flips below if it would clip viewport top,
 * clamps horizontally with 16px margins. Shown only while cell is focused with non-collapsed selection.
 *
 * Formatting via document.execCommand (deprecated but universally supported, preserves undo buffer).
 * Active state via queryCommandState; link detection via anchor ancestor.
 *
 * ponytail: no popover library — link URL via window.prompt for v1 (covers isSafeHref validation),
 * avoids adding @base-ui popover dependency for tracer.
 */

interface FloatingToolbarProps {
  targetRef: React.RefObject<HTMLElement | null>
}

export function FloatingToolbar({ targetRef }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [active, setActive] = useState({ bold: false, italic: false, underline: false, list: false, link: false })

  useMountEffect(() => {
    const el = targetRef.current
    if (!el) return

    const update = () => {
      const sel = window.getSelection()
      const activeEl = document.activeElement as HTMLElement | null
      const isFocused = activeEl !== null && (activeEl === el || el.contains(activeEl))
      const hasSelection =
        sel !== null &&
        !sel.isCollapsed &&
        sel.rangeCount > 0 &&
        ((sel.anchorNode !== null && el.contains(sel.anchorNode)) ||
          (sel.focusNode !== null && el.contains(sel.focusNode)) ||
          (sel.anchorNode === el as unknown as Node))
      if (!isFocused || !hasSelection || sel === null || sel.rangeCount === 0) {
        setVisible(false)
        return
      }
      // Check active formats
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        list: document.queryCommandState('insertUnorderedList'),
        link: isSelectionInLink(sel),
      })

      // Position above selection rect — defer until toolbar has width
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      // If rect is empty (collapsed or off-screen), hide
      if (rect.width === 0 && rect.height === 0) {
        setVisible(false)
        return
      }
      const toolbarW = toolbarRef.current?.offsetWidth
      const effectiveW = toolbarW !== undefined && toolbarW > 0 ? toolbarW : 220
      const toolbarH = toolbarRef.current?.offsetHeight
      const effectiveH = toolbarH !== undefined && toolbarH > 0 ? toolbarH : 36
      let top = rect.top - effectiveH - 8 // 8px gap
      let left = rect.left + rect.width / 2 - effectiveW / 2
      // Flip below if clipped
      if (top < 16) top = rect.bottom + 8
      // Clamp horizontal
      left = Math.max(16, Math.min(left, window.innerWidth - effectiveW - 16))
      setPos({ top: Math.round(top), left: Math.round(left) })
      setVisible(true)
    }

    const handleSelectionChange = () => update()
    const handleMouseUp = () => {
      // Selection via drag ends with mouseup, not just selectionchange
      setTimeout(update, 0)
    }
    const handleKeyUp = () => update()
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)
    // Also update on scroll/resize while visible
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    // Initial
    update()
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  })

  if (!visible) return null

  const btnClass = (isActive: boolean) =>
    `rounded p-1.5 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-foreground/10'}`

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    // Keep focus in cell so toolbar stays visible and next exec works
    targetRef.current?.focus()
  }

  const handleLink = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    if (active.link) {
      exec('unlink')
      return
    }
    const href = window.prompt('Enter URL (http, https, or mailto):', 'https://')
    if (href === null) return
    if (href.trim() === '') return
    // Basic safe check — full refine happens at commit via isSafeHref/Zod
    if (!/^(https?|mailto):/i.test(href.trim())) {
      window.alert('Link must start with http://, https://, or mailto:')
      return
    }
    exec('createLink', href.trim())
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md print:hidden"
      style={{ top: pos.top, left: pos.left }}
      role="toolbar"
      aria-label="Formatting"
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" aria-label="Bold" className={btnClass(active.bold)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
        <Bold className="size-4" />
      </button>
      <button type="button" aria-label="Italic" className={btnClass(active.italic)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}>
        <Italic className="size-4" />
      </button>
      <button type="button" aria-label="Underline" className={btnClass(active.underline)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}>
        <Underline className="size-4" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <button type="button" aria-label="Bulleted list" className={btnClass(active.list)} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
        <List className="size-4" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <button type="button" aria-label={active.link ? 'Remove link' : 'Add link'} className={btnClass(active.link)} onMouseDown={(e) => e.preventDefault()} onClick={handleLink}>
        {active.link ? <Link2Off className="size-4" /> : <LinkIcon className="size-4" />}
      </button>
    </div>
  )
}

function isSelectionInLink(sel: Selection): boolean {
  const node = sel.anchorNode
  if (!node) return false
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
  return el?.closest('a') !== null
}
