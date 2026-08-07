import type { DocumentModel } from './types'

/**
 * Synthetic fixture data only — never real customer PII (RESEARCH Security Domain,
 * threat T-01-02). Every name/address below is fictional.
 */

/** Self-contained 96x96 rounded-square SVG mark: solid brand color + white "PC" monogram. */
const LOGO_DATA_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
      `<rect width="96" height="96" rx="16" fill="#1d4ed8"/>` +
      `<text x="48" y="62" font-family="Arial, sans-serif" font-size="40" font-weight="bold" ` +
      `fill="#ffffff" text-anchor="middle">PC</text>` +
      `</svg>`,
  )

/** 18 line items sized so the A4 @15mm print projection paginates to >= 2 pages. */
const TORTURE_LINE_ITEMS = Array.from({ length: 18 }, (_, i) => ({
  id: `torture-${i + 1}`,
  title: `Druckdienstleistung ${i + 1}`,
  description:
    'Laufender Text mit Umlauten (Müller, Überweisung, Fußgänger) und langen, ' +
    'umbrechenden Beschreibungen, die den Zeilenumbruch im A4-Format erzwingen — ' +
    'Absatz eins bis drei, damit die Tabelle mehrseitig paginiert wird.',
  quantity: i % 3 === 0 ? 3 : 1,
  unitPriceMinor: 12500 + i * 1375,
  taxRateMinor: 1900,
}))

export const FIXTURE_MAP: Record<string, DocumentModel> = {
  'invoice-torture': {
    id: 'torture-invoice',
    type: 'invoice',
    currency: 'EUR',
    issueDate: '2026-08-07',
    number: 'RE-2026-0142',
    company: {
      name: 'Gesellschaft für innovative Drucktechnologien und Dokumentenmanagement mbH',
      address: ['Müllerstraße 12', '10115 Berlin', 'Deutschland'],
      email: 'rechnung@beispiel-druckerei.test',
      logo: LOGO_DATA_URL,
    },
    customer: {
      name: 'José Álvarez García',
      address: ['Calle de la Fuente 27', '28004 Madrid', 'España'],
    },
    lineItems: TORTURE_LINE_ITEMS,
    watermark: 'draft',
  },
  'invoice-simple': {
    id: 'simple-invoice',
    type: 'invoice',
    currency: 'EUR',
    issueDate: '2026-08-07',
    number: 'RE-2026-0001',
    company: {
      name: 'Müller GmbH',
      address: ['Industriestraße 5', '60327 Frankfurt am Main', 'Deutschland'],
      email: 'kontakt@mueller-beispiel.test',
      logo: null,
    },
    customer: {
      name: 'Beispiel Kundin',
      address: ['Beispielweg 9', '80331 München', 'Deutschland'],
    },
    lineItems: [
      {
        id: 'simple-1',
        title: 'Beratung',
        description: 'Strategieberatung, 2 Stunden',
        quantity: 2,
        unitPriceMinor: 90000,
        taxRateMinor: 1900,
      },
      {
        id: 'simple-2',
        title: 'Entwurf',
        description: 'Gestaltungsentwurf Briefkopf',
        quantity: 1,
        unitPriceMinor: 45000,
        taxRateMinor: 1900,
      },
      {
        id: 'simple-3',
        title: 'Druck',
        description: 'Farbdruck A4, 50 Exemplare',
        quantity: 50,
        unitPriceMinor: 120,
        taxRateMinor: 1900,
      },
      {
        id: 'simple-4',
        title: 'Porto',
        description: 'Versand per Post',
        quantity: 1,
        unitPriceMinor: 590,
        taxRateMinor: 0,
      },
      {
        id: 'simple-5',
        title: 'Korrektur',
        description: 'Korrekturschleife Abschlussfassung',
        quantity: 1,
        unitPriceMinor: 30000,
        taxRateMinor: 1900,
      },
    ],
    watermark: null,
  },
}
