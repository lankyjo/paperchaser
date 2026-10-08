// Sample documents for one invented job, shown on the landing page as real A4 sheets.
export const SAMPLE_SENDER = { name: 'Halden & Co.', address: '41 Ropewalk Lane, Bristol', email: 'hello@halden.studio', signer: 'Ada Ekwueme' }
export const SAMPLE_CLIENT = { name: 'Acme Coffee Roasters', address: '300 Main Street, Portland' }
export const SAMPLE_BANK = [['Bank', 'Starling Bank'], ['IBAN', 'GB29 SRLG 6083 7140 2193 58']]

export type SampleLine = [label: string, note: string, value: string]

export type SampleSheet = {
  title: string
  meta: [string, string]
  parties?: [string, string]
  prose?: string[]
  lines?: SampleLine[]
  total?: [string, string]
  metrics?: [string, string][]
  ratings?: [string, number][]
  question?: string
  signed?: boolean
  clientSigns?: boolean
  paid?: boolean
  paymentRef?: string
}

export const SAMPLE_SHEETS: SampleSheet[] = [
  { title: 'Quote', meta: ['Q-2026-0007', 'Valid until 30 Oct'], parties: ['From', 'For'], lines: [['Brand discovery workshop', 'Half day, two founders', '€640.00'], ['Visual identity', 'Logo, palette, type system', '€2,400.00'], ['Packaging system', '3 bag sizes', '€1,172.50']], total: ['Quote total', '€4,212.50'], paymentRef: 'Q-2026-0007' },
  { title: 'Agreement', meta: ['A-2026-0003', 'Signed 2 Oct'], prose: ['Scope. Visual identity and packaging for Acme Coffee Roasters, two rounds of revisions.', 'Payment. 50% deposit on signing, 50% on delivery. Rights transfer on full payment.'], lines: [['Deposit', 'On signing', '€2,106.25'], ['Balance', 'On delivery', '€2,106.25']], signed: true, clientSigns: true },
  { title: 'Welcome', meta: ['Acme rebrand', 'Week 1'], prose: ['Welcome aboard, Acme. Here is how the next six weeks go, and how to reach us.'], lines: [['Kick-off workshop', 'At your roastery', 'Tue 6 Oct'], ['First concepts', 'Three directions', 'Fri 16 Oct'], ['Final files', 'Everything, ready to print', 'Fri 13 Nov']] },
  { title: 'Brief', meta: ['Acme rebrand', 'Approved 5 Oct'], lines: [['Objective', 'Look like the specialty roaster Acme already is', ''], ['Audience', 'Cafe owners and home brewers, 25 to 45', ''], ['Key message', 'Roasted this week, in Portland', ''], ['Deliverables', 'Logo, palette, 3 packaging sizes', '']] },
  { title: 'Invoice', meta: ['INV-2026-0042', 'Due 22 Oct'], parties: ['From', 'Bill to'], lines: [['Deposit, 50%', 'Agreement A-2026-0003', '€2,106.25'], ['VAT 20%', '', '€421.25']], total: ['Total due', '€2,527.50'], paymentRef: 'INV-2026-0042' },
  { title: 'Delivery', meta: ['Acme rebrand', '13 Nov'], lines: [['Logo files', 'SVG, PNG, PDF · light and dark', 'ZIP · 18 MB'], ['Brand guidelines', '24 pages', 'PDF'], ['Packaging artwork', '3 sizes, print-ready', 'ZIP · 46 MB'], ['Usage rights', 'Full transfer on final payment', '']] },
  { title: 'Report', meta: ['Acme social', 'October 2026'], metrics: [['48.2k', 'Views'], ['6.7%', 'Engagement'], ['+312', 'Followers']], lines: [['Top post', 'New roast launch reel', '12.4k views'], ['Next month', 'Holiday gift bundles', '']] },
  { title: 'Receipt', meta: ['R-2026-0019', 'Paid 20 Oct'], parties: ['From', 'Received from'], lines: [['Payment for INV-2026-0042', 'Bank transfer', '€2,527.50'], ['Balance still due', '', '€0.00']], paid: true, paymentRef: 'INV-2026-0042' },
  { title: 'Thank you', meta: ['Acme rebrand', 'Complete'], prose: ['Thank you for trusting us with Acme’s new look. Seeing the bags on cafe shelves this month has been the best part.', 'If a friend needs the same, we would love an introduction.'], signed: true },
  { title: 'Feedback', meta: ['Acme rebrand', 'Please reply by 30 Nov'], ratings: [['Communication', 5], ['Quality of work', 5], ['Staying on schedule', 4], ['Value for money', 4]], question: 'May we quote you on our website? Yes / No' },
]
