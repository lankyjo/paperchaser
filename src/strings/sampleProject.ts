// Content of the deletable sample project created on first launch.
export const SAMPLE_PROJECT = {
  title: 'Sample: Acme coffee rebrand',
  client: {
    name: 'Acme Coffee Roasters',
    contactPerson: 'Jamie Rivera',
    email: 'accounts@acme-coffee.test',
    billingAddress: ['300 Main Street', 'Portland, OR 97205', 'United States'],
  },
  lineItems: [
    { title: 'Brand identity design', description: 'Logo, color palette and typography system', quantity: 1, unitPriceMinor: 120000 },
    { title: 'Website landing page', description: 'Responsive single-page site', quantity: 1, unitPriceMinor: 85000 },
    { title: 'Monthly retainer', description: 'Design support and revisions', quantity: 3, unitPriceMinor: 25000 },
  ],
}

// Number shown on each numbered sample document; never drawn from the real sequences.
export const SAMPLE_NUMBERS: Record<string, string> = {
  quote: 'SAMPLE-Q-01',
  agreement: 'SAMPLE-A-01',
  invoice: 'SAMPLE-INV-01',
  creditNote: 'SAMPLE-CN-01',
  receipt: 'SAMPLE-R-01',
}
