import { useRef } from 'react'
import { Bold, Italic, Underline, List, Link as LinkIcon, Link2Off } from 'lucide-react'
import { toggleSelectionLink } from './toggleSelectionLink'
import { useSelectionToolbar } from './useSelectionToolbar'

// Formatting toolbar that floats above the selection in a focused rich-text cell; never inside #print-root.
interface FloatingToolbarProps {
  targetRef: React.RefObject<HTMLElement | null>
}

export function FloatingToolbar({ targetRef }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const { visible, pos, flipped, active } = useSelectionToolbar(targetRef, toolbarRef)

  if (!visible) return null

  const btnClass = (isActive: boolean) =>
    `rounded p-1.5 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-foreground/10'}`

  // execCommand keeps the browser undo stack; refocusing the cell keeps the toolbar open for the next command.
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    targetRef.current?.focus()
  }

  const handleLink = () => toggleSelectionLink(active.link, exec)

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md print:hidden"
      style={{ top: pos.top, left: pos.left }}
      role="toolbar"
      aria-label="Formatting"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 size-2 -translate-x-1/2 rotate-45 border bg-popover ${flipped ? '-top-1 border-t-0 border-l-0 border-r border-b' : '-bottom-1 border-b-0 border-r-0 border-l border-t'} `}
      />
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
