import type { DocumentModel, RichTextDoc } from './types'

/**
 * Synthetic fixture data only — never real customer PII (RESEARCH Security Domain,
 * threat T-01-02). Every name/address below is fictional.
 *
 * D-05: content translated to English IN PLACE — fixture ids, shape, and
 * LOGO_DATA_URL unchanged (routes FIXTURE_KEYS and the harness LOGO_COLOR
 * depend on them); only content strings differ from the original German set.
 *
 * D-06/D-29: text fields are single-paragraph/single-text ASTs (the
 * migration wrap shape). The single-paragraph case MUST render pixel-identical
 * to the plain-string form (Pitfall 3 — losslessness proof).
 */

/** Wrap a plain string in a single-paragraph/single-text AST. */
function ast(s: string): RichTextDoc {
  return [{ type: 'paragraph', content: [{ type: 'text', text: s }] }]
}

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
  title: ast(`Print service ${i + 1}`),
  description: ast(
    'Running text with long, wrapping descriptions that force line breaks in the ' +
      'A4 layout — paragraphs one through three, so the table paginates across ' +
      'multiple pages without truncation or ellipsis.',
  ),
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
    number: ast('INV-2026-0142'),
    company: {
      name: ast('Innovative Print Technologies and Document Management GmbH'),
      address: ['12 Miller Street', 'Berlin 10115', 'Germany'].map(ast),
      email: ast('billing@example-printers.test'),
      logo: LOGO_DATA_URL,
    },
    customer: {
      name: ast('José Álvarez García'),
      address: ['Calle de la Fuente 27', '28004 Madrid', 'Spain'].map(ast),
    },
    lineItems: TORTURE_LINE_ITEMS,
    status: 'draft',
  },
  'invoice-simple': {
    id: 'simple-invoice',
    type: 'invoice',
    currency: 'EUR',
    issueDate: '2026-08-07',
    number: ast('INV-2026-0001'),
    company: {
      name: ast('Miller Print Studio'),
      address: ['5 Industry Street', 'Frankfurt am Main 60327', 'Germany'].map(ast),
      email: ast('hello@miller-studio.test'),
      logo: null,
    },
    customer: {
      name: ast('Example Customer'),
      address: ['9 Sample Way', 'Munich 80331', 'Germany'].map(ast),
    },
    lineItems: [
      {
        id: 'simple-1',
        title: ast('Consulting'),
        description: ast('Strategy consulting, 2 hours'),
        quantity: 2,
        unitPriceMinor: 90000,
        taxRateMinor: 1900,
      },
      {
        id: 'simple-2',
        title: ast('Design'),
        description: ast('Letterhead design draft'),
        quantity: 1,
        unitPriceMinor: 45000,
        taxRateMinor: 1900,
      },
      {
        id: 'simple-3',
        title: ast('Printing'),
        description: ast('Color print A4, 50 copies'),
        quantity: 50,
        unitPriceMinor: 120,
        taxRateMinor: 1900,
      },
      {
        id: 'simple-4',
        title: ast('Postage'),
        description: ast('Shipment by post'),
        quantity: 1,
        unitPriceMinor: 590,
        taxRateMinor: 0,
      },
      {
        id: 'simple-5',
        title: ast('Revision'),
        description: ast('Revision pass on the final version'),
        quantity: 1,
        unitPriceMinor: 30000,
        taxRateMinor: 1900,
      },
    ],
    status: 'paid',
  },
  /**
   * D-11: the empty-store demo document — English Minimal, 3 line items,
   * fictional names/addresses only (T-01-02 synthetic-data rule).
   * Internal `model.id` is EXACTLY 'demo-invoice' — seedDemoIfEmpty's
   * get/put idempotence keys on this id (a mismatch would re-seed on every load).
   */
  'invoice-demo': {
    id: 'demo-invoice',
    type: 'invoice',
    currency: 'EUR',
    issueDate: '2026-08-08',
    number: ast('INV-2026-0001'),
    template: 'minimal',
    status: 'draft',
    company: {
      name: ast('Northwind Studio'),
      address: ['12 Harbor Lane', 'Portland, OR 97201', 'United States'].map(ast),
      email: ast('hello@northwind-studio.test'),
      logo: null, // edge-14: no logo → header renders without the img element
    },
    customer: {
      name: ast('Acme Coffee Roasters'),
      address: ['300 Main Street', 'Portland, OR 97205', 'United States'].map(ast),
    },
    lineItems: [
      {
        id: 'demo-1',
        title: ast('Brand identity design'),
        description: ast('Logo, color palette, and typography system'),
        quantity: 1,
        unitPriceMinor: 120000,
        taxRateMinor: 1900,
      },
      {
        id: 'demo-2',
        title: ast('Website landing page'),
        description: ast('Responsive single-page site'),
        quantity: 1,
        unitPriceMinor: 85000,
        taxRateMinor: 1900,
      },
      {
        id: 'demo-3',
        title: ast('Monthly retainer'),
        description: ast('Design support and revisions'),
        quantity: 3,
        unitPriceMinor: 25000,
        taxRateMinor: 1900,
      },
    ],
  },
}
