/**
 * Pure money/rounding helpers for the domain core.
 *
 * Nothing in this file may depend on React, the DOM, or Dexie — Node-testable
 * by construction (02-RESEARCH.md Architecture Responsibility Map).
 */

/** Currency → decimal places. D-12: EUR 2dp, JPY 0dp. Registry entries, not model changes. */
export const CURRENCY_DECIMALS: Readonly<Record<string, number>> = { EUR: 2, JPY: 0 }

/**
 * Parse a raw numeric string to minor units via CURRENCY_DECIMALS + roundMinor.
 * Returns null for invalid input (NaN, empty, negative per nonnegative schema).
 * Normalizes comma decimal separator to dot. Uses roundMinor for half-away-from-zero
 * then scales to minor — never bare floats without the shared primitive (T-04-14).
 */
export function parseToMinor(raw: string, currency: string): number | null {
  const dec = CURRENCY_DECIMALS[currency] ?? 2
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.') return null
  if (!/^-?\d*\.?\d*$/.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return null
  if (parsed < 0) return null
  // Reject multiple dots already covered by regex, but also guard comma handling
  const minor = Math.round(roundMinor(parsed, dec) * 10 ** dec)
  if (!Number.isInteger(minor) || minor < 0) return null
  return minor
}

/** Convert minor units back to a raw decimal string for edit mode (no currency formatting). */
export function minorToRaw(minor: number, currency: string): string {
  const dec = CURRENCY_DECIMALS[currency] ?? 2
  const major = minor / 10 ** dec
  // Avoid floating representation noise: use fixed then trim trailing zeros
  if (dec === 0) return Math.round(major).toString()
  return major.toString()
}

/** Check if a raw string is valid nonnegative numeric input (for isValid helper). */
export function isValidNumericRaw(raw: string): boolean {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.') return false
  if (!/^-?\d*\.?\d*$/.test(normalized)) return false
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && !Number.isNaN(parsed) && parsed >= 0
}

/** Parse a raw quantity string (float, nonnegative, not minor-scaled). */
export function parseQuantity(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.') return null
  if (!/^-?\d*\.?\d*$/.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

/**
 * Round half away from zero to `decimals` places — matches
 * Intl.NumberFormat's default halfExpand [CITED: MDN]. The single rounding
 * primitive for all money math; bare Math.round is banned in money code
 * (PITFALLS.md:232).
 */
export function roundMinor(value: number, decimals: number): number {
  const f = 10 ** decimals
  return (Math.sign(value) * Math.round(Math.abs(value) * f)) / f
}
