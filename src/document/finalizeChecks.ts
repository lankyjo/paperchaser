import { isMoneyDocument } from './documentBlocks'
import { countPlaceholderNodes, getPlainText } from './richtext'
import { computeTotals } from './totals'
import type { DocumentModel } from './types'

// Placeholders left anywhere in the document's text: parties, line items and content blocks.
export function countPlaceholders(doc: DocumentModel): number {
  const fields = [
    doc.customer.name,
    ...doc.customer.address,
    doc.company.name,
    ...doc.company.address,
    ...doc.lineItems.flatMap((item) => [item.title, item.description]),
    ...(doc.blocks ?? []).flatMap((b) => (b.type === 'richText' ? [b.content] : [])),
  ]
  return fields.reduce((n, field) => n + countPlaceholderNodes(field), 0)
}

// Things to fix before a document is finalized; the user may still proceed.
export function preFinalizeWarnings(doc: DocumentModel): string[] {
  const warnings: string[] = []
  const placeholders = countPlaceholders(doc)
  if (placeholders > 0) warnings.push(`${placeholders} placeholder${placeholders === 1 ? '' : 's'} still need${placeholders === 1 ? 's' : ''} filling in`)
  if (!isMoneyDocument(doc)) return warnings
  if (doc.customer.address.every((line) => getPlainText(line).trim() === '')) warnings.push('The client address is missing')
  if (computeTotals(doc).taxMinor > 0 && !doc.company.taxId) warnings.push('Tax is charged but your tax ID is missing')
  return warnings
}
