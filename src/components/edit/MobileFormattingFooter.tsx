import { Bold, Italic, Underline, List, Link as LinkIcon, Link2Off, X } from 'lucide-react'
import { toggleSelectionLink } from './toggleSelectionLink'
import { useFocusedCellFormats } from './useFocusedCellFormats'

// Sticky formatting bar shown below 1024px while a contentEditable cell has focus; desktop uses the floating toolbar.
export function MobileFormattingFooter() {
  const { visible, active } = useFocusedCellFormats()

  if (!visible) return null

  const btnClass = (isActive: boolean) =>
    `flex size-11 items-center justify-center rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-foreground/10'}`

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    const ae = document.activeElement as HTMLElement | null
    ae?.focus()
  }

  const handleLink = () => toggleSelectionLink(active.link, exec)

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
