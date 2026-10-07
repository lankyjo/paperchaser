// Pure money and rounding helpers; no React, DOM or Dexie.

// Fraction digits Intl uses for a currency: 0 for JPY, 2 for EUR, 3 for KWD.
export function currencyDecimals(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
}

export function isSupportedCurrency(code: string): boolean {
  return /^[A-Z]{3}$/.test(code) && Intl.supportedValuesOf('currency').includes(code)
}

// Older documents carry no locale and keep the German euro formatting they were created with.
export function formatMoney(minor: number, currency: string, locale = 'de-DE'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 10 ** currencyDecimals(currency))
}

// Group and decimal separators of a locale, e.g. "." and "," for de-DE.
function separators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5)
  return { group: parts.find((p) => p.type === 'group')?.value ?? ',', decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.' }
}

// Normalizes typed number text to "1234.56"; without a locale a single comma is read as the decimal point.
function normalizeNumber(raw: string, locale?: string): string {
  const trimmed = raw.trim()
  if (locale === undefined) return trimmed.replace(',', '.')
  const { group, decimal } = separators(locale)
  return trimmed.replace(/\s/g, '').split(group).join('').replace(decimal, '.')
}

// Parses typed money text to nonnegative integer minor units, or null if invalid.
export function parseToMinor(raw: string, currency: string, locale?: string): number | null {
  const dec = currencyDecimals(currency)
  const normalized = normalizeNumber(raw, locale)
  if (normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.') return null
  if (!/^-?\d*\.?\d*$/.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  const minor = Math.round(roundMinor(parsed, dec) * 10 ** dec)
  return Number.isInteger(minor) && minor >= 0 ? minor : null
}

// Minor units as editable text without grouping, in the locale's decimal style; trailing zeros dropped.
export function minorToRaw(minor: number, currency: string, locale = 'en-US'): string {
  const dec = currencyDecimals(currency)
  return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: dec }).format(minor / 10 ** dec)
}

// Percentages are stored in hundredths of a percent: 1900 is 19%.
export const percentToMinor = (percent: number) => Math.round(percent * 100)
export const minorToPercent = (minor: number) => minor / 100

/** Parse a raw quantity string (float, nonnegative, not minor-scaled). */
export function parseQuantity(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.') return null
  if (!/^-?\d*\.?\d*$/.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

// Rounds half away from zero (matching Intl.NumberFormat halfExpand); the only rounding primitive allowed in money math.
export function roundMinor(value: number, decimals: number): number {
  const f = 10 ** decimals
  return (Math.sign(value) * Math.round(Math.abs(value) * f)) / f
}
