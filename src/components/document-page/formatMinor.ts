const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

// Formats minor units (cents) as a German-locale euro amount.
export function formatMinor(minor: number): string {
  return EUR.format(minor / 100)
}
