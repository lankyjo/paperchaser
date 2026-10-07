export interface ActiveFormats {
  bold: boolean
  italic: boolean
  underline: boolean
  list: boolean
  link: boolean
}

export const NO_ACTIVE_FORMATS: ActiveFormats = { bold: false, italic: false, underline: false, list: false, link: false }

function isSelectionInLink(): boolean {
  const node = window.getSelection()?.anchorNode
  if (!node) return false
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
  return el?.closest('a') !== null
}

// Reads which formats apply at the current selection, for toolbar active states.
export function readActiveFormats(): ActiveFormats {
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    list: document.queryCommandState('insertUnorderedList'),
    link: isSelectionInLink(),
  }
}
