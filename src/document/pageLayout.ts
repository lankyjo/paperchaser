import type { Block } from './blocks'
import { DOC_TYPES } from './docTypes'
import { documentBlocks } from './documentBlocks'
import { printedTotals } from './finalize'
import { resolveTokens } from './resolveTokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from './types'
import { watermarkFor } from './watermark'

// Regions that use US Letter paper by default.
const LETTER_REGIONS = new Set(['US', 'CA', 'MX', 'PH', 'CL', 'CO', 'VE', 'PR', 'GT', 'CR', 'PA', 'DO', 'SV'])

// The stored page size, else Letter for Letter regions and A4 everywhere else.
export function pageSizeFor(doc: Pick<DocumentModel, 'pageSize' | 'locale'>): PageSize {
  if (doc.pageSize) return doc.pageSize
  if (!doc.locale) return 'a4'
  try {
    return LETTER_REGIONS.has(new Intl.Locale(doc.locale).maximize().region ?? '') ? 'letter' : 'a4'
  } catch {
    return 'a4'
  }
}

export type PageItem = { id: 'header' | 'date' | 'footer'; block?: undefined } | { id: string; block: Block }

// Everything a document prints, in order: header, date line, visible blocks, footer.
export function pageItemsFor(doc: DocumentModel): PageItem[] {
  const visibility = doc.settings?.blockVisibility ?? {}
  const dateField = DOC_TYPES[doc.type].dateField
  return [
    ...(visibility.header !== false ? [{ id: 'header' as const }] : []),
    ...(dateField && doc[dateField] ? [{ id: 'date' as const }] : []),
    ...documentBlocks(doc).filter((b) => !b.hidden).map((block) => ({ id: block.id, block })),
    ...(visibility.footer !== false ? [{ id: 'footer' as const }] : []),
  ]
}

const SPLITTABLE_BLOCKS = new Set<Block['type']>(['richText', 'table', 'steps', 'lineItems'])

// Whether an item may break across pages between its rows, paragraphs or steps.
export const isSplittable = (item: PageItem) => item.block !== undefined && SPLITTABLE_BLOCKS.has(item.block.type)

// The 15mm page padding in CSS px at 96dpi.
export const PAGE_PADDING_PX = (15 * 96) / 25.4

// Everything a renderer needs for one document: resolved template tokens, printed totals, watermark text and items.
export function resolvePage(doc: DocumentModel, template?: TemplateId, branding?: Partial<Branding>) {
  const brand = branding ?? doc.branding
  return {
    tokens: resolveTokens(template ?? doc.template ?? 'minimal', brand),
    totals: printedTotals(doc),
    watermark: watermarkFor(doc, brand),
    items: pageItemsFor(doc),
  }
}
