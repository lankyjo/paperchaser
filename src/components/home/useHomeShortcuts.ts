import { useMountEffect } from '../../hooks/useMountEffect'

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

// Home keys: Ctrl/Cmd+K or / focus the command bar, N names a new project, I starts a quick invoice.
export function useHomeShortcuts({ focusSearch, quickInvoice }: { focusSearch: () => void; quickInvoice: () => void }) {
  useMountEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        focusSearch()
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if (event.key === '/' || event.key.toLowerCase() === 'n') {
        event.preventDefault()
        focusSearch()
      } else if (event.key.toLowerCase() === 'i') {
        event.preventDefault()
        quickInvoice()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}
