import type { DocumentModel } from './types'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Same day next month in UTC, clamped to the last day when the month is shorter.
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(d, lastDay))
  return target.toISOString().slice(0, 10)
}

// "December 2026" becomes "January 2027" wherever a heading names a period.
const advancePeriod = (text: string) =>
  text.replace(new RegExp(`\\b(${MONTHS.join('|')}) (\\d{4})\\b`, 'g'), (_, month: string, year: string) => {
    const idx = MONTHS.indexOf(month)
    return idx === 11 ? `January ${Number(year) + 1}` : `${MONTHS[idx + 1]} ${year}`
  })

// A retainer's next invoice or report: a draft copy a month later, unnumbered, with no payments or snapshot.
export function forNextMonth(doc: DocumentModel, id: string): DocumentModel {
  return {
    ...doc,
    id,
    status: 'draft',
    number: '',
    issueDate: addMonths(doc.issueDate, 1),
    ...(doc.dueDate !== undefined && { dueDate: addMonths(doc.dueDate, 1) }),
    frozen: undefined,
    payments: undefined,
    rev: undefined,
    outcome: undefined,
    blocks: doc.blocks?.map((b) => (b.type === 'heading' ? { ...b, text: advancePeriod(b.text) } : b)),
  }
}
