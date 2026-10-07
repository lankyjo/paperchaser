// Removes the link at the selection, or prompts for an http, https or mailto URL and links the selection.
export function toggleSelectionLink(linkActive: boolean, exec: (cmd: string, value?: string) => void) {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  if (linkActive) {
    exec('unlink')
    return
  }
  const href = window.prompt('Enter URL (http, https, or mailto):', 'https://')
  if (href === null || href.trim() === '') return
  // Quick check for the user; the schema validates the href again on commit.
  if (!/^(https?|mailto):/i.test(href.trim())) {
    window.alert('Link must start with http://, https://, or mailto:')
    return
  }
  exec('createLink', href.trim())
}
