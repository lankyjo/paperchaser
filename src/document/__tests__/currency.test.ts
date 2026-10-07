import { describe, expect, it } from 'vitest'

import { currencyDecimals, formatMoney, isSupportedCurrency, minorToRaw, parseToMinor } from '../money'

describe('currencyDecimals', () => {
  it('comes from Intl for any ISO currency: JPY 0, EUR 2, KWD 3', () => {
    expect(currencyDecimals('JPY')).toBe(0)
    expect(currencyDecimals('EUR')).toBe(2)
    expect(currencyDecimals('KWD')).toBe(3)
  })

  it('accepts real ISO codes only', () => {
    expect(isSupportedCurrency('NGN')).toBe(true)
    expect(isSupportedCurrency('XYZ1')).toBe(false)
  })
})

// Intl separates some currency codes with a non-breaking space.
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('formatMoney', () => {
  it('formats minor units in the currency and locale, defaulting to German euro formatting for older documents', () => {
    expect(formatMoney(123456, 'EUR', 'en-US')).toBe('€1,234.56')
    expect(formatMoney(1234, 'JPY', 'en-US')).toBe('¥1,234')
    expect(plain(formatMoney(123456, 'KWD', 'en-US'))).toBe('KWD 123.456')
    expect(plain(formatMoney(123456, 'EUR'))).toBe('1.234,56 €')
  })
})

describe('locale-aware input', () => {
  it('reads the locale’s own separators', () => {
    expect(parseToMinor('1.234,56', 'EUR', 'de-DE')).toBe(123456)
    expect(parseToMinor('1,234.56', 'EUR', 'en-US')).toBe(123456)
    expect(parseToMinor('1 234,5', 'EUR', 'fr-FR')).toBe(123450)
    expect(parseToMinor('12.5', 'KWD', 'en-US')).toBe(12500)
    expect(parseToMinor('abc', 'EUR', 'en-US')).toBeNull()
  })

  it('prints minor units back as editable text in the locale', () => {
    expect(minorToRaw(123456, 'EUR', 'de-DE')).toBe('1234,56')
    expect(minorToRaw(123456, 'EUR', 'en-US')).toBe('1234.56')
    expect(minorToRaw(1234, 'JPY', 'en-US')).toBe('1234')
  })
})
