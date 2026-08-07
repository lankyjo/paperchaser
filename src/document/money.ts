/**
 * Pure money/rounding helpers for the domain core.
 *
 * Nothing in this file may depend on React, the DOM, or Dexie — Node-testable
 * by construction (02-RESEARCH.md Architecture Responsibility Map).
 */

/** Currency → decimal places. D-12: EUR 2dp, JPY 0dp. Registry entries, not model changes. */
export const CURRENCY_DECIMALS: Readonly<Record<string, number>> = { EUR: 2, JPY: 0 }

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
