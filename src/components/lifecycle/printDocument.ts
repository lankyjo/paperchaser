import { getPlainText } from '../../document/richtext'
import { DOC_TITLES } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

// Opens the print dialog with the tab title set so "Save as PDF" suggests e.g. "Invoice INV-0007".
export function printDocument(doc: DocumentModel) {
  const previous = document.title
  document.title = [DOC_TITLES[doc.type], getPlainText(doc.number)].filter(Boolean).join(' ')
  window.print()
  document.title = previous
}
