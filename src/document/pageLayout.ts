import type { Block } from './blocks'
import { DOC_TYPES } from './docTypes'
import { documentBlocks, isMoneyDocument } from './documentBlocks'
import { formatMoney } from './money'
import { printedTotals } from './finalize'
import { formatDocDate } from './formatDocDate'
import { getPlainText } from './richtext'
import { DOC_LABELS } from '../strings/documentLabels'
import { resolveTokens, toCssVars } from './resolveTokens'
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

// Every template's page padding in mm, and the same in CSS px at 96dpi for pagination.
export const PAGE_PADDING_MM = 15
export const PAGE_PADDING_PX = (PAGE_PADDING_MM * 96) / 25.4

// The document's template, Minimal when none is set.
export const templateIdFor = (doc: Pick<DocumentModel, 'template'>): TemplateId => doc.template ?? 'minimal'

// Everything a renderer needs for one document: resolved template tokens, printed totals, watermark text and items.
export function resolvePage(doc: DocumentModel, template?: TemplateId, branding?: Partial<Branding>) {
  const brand = branding ?? doc.branding
  const templateId = template ?? templateIdFor(doc)
  const tokens = resolveTokens(templateId, brand, doc.frozen?.templateVersion)
  const watermark = watermarkFor(doc, brand)
  return {
    templateId,
    tokens,
    totals: printedTotals(doc),
    items: pageItemsFor(doc),
    // What every page frame needs: the template's CSS variables and the watermark in the accent color.
    frame: { cssVars: toCssVars(tokens), watermark: watermark === null ? null : { text: watermark, color: tokens.accent } },
  }
}

const DATE_LABELS = { validUntil: DOC_LABELS.validUntil, dueDate: DOC_LABELS.dueDate }

// Plain-text facts every header shows: title, sender, number, formatted dates and, on money documents, the amount.
export function documentFacts(doc: DocumentModel) {
  const dateField = DOC_TYPES[doc.type].dateField
  const date = dateField ? doc[dateField] : undefined
  const dueOrValid = dateField && date ? { label: DATE_LABELS[dateField], value: formatDocDate(date, doc.locale) } : null
  return {
    title: DOC_TYPES[doc.type].title,
    company: getPlainText(doc.company.name),
    companyLines: [...doc.company.address.map(getPlainText), getPlainText(doc.company.email)].filter((line) => line !== ''),
    number: getPlainText(doc.number),
    issued: formatDocDate(doc.issueDate, doc.locale),
    date: dueOrValid,
    // Issued first, then the due or valid-until date when there is one.
    dates: [{ label: DOC_LABELS.issued, value: formatDocDate(doc.issueDate, doc.locale) }, ...(dueOrValid ? [dueOrValid] : [])],
    amount: isMoneyDocument(doc) ? formatMoney(printedTotals(doc).grandTotalMinor, doc.currency, doc.locale) : null,
  }
}
