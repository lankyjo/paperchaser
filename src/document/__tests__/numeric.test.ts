import { describe, expect, it } from 'vitest'
import { minorToRaw, parseQuantity, parseToMinor, roundMinor } from '../money'

describe('roundMinor precision (D-09, T-04-14)', () => {
  it('EUR 2dp: 19.99 stays 19.99', () => {
    expect(roundMinor(19.99, 2)).toBe(19.99)
  })
  it('JPY 0dp: 1000 stays 1000', () => {
    expect(roundMinor(1000, 0)).toBe(1000)
  })
  it('half-up: 0.005 EUR (2dp) → 0.01', () => {
    expect(roundMinor(0.005, 2)).toBe(0.01)
  })
  it('half-up negative: -2.5 with 0dp → -3', () => {
    expect(roundMinor(-2.5, 0)).toBe(-3)
  })
})

describe('parseToMinor — EUR 2dp', () => {
  it(' "19.99" EUR → 1999', () => {
    expect(parseToMinor('19.99', 'EUR')).toBe(1999)
  })
  it(' "1.5" EUR → 150', () => {
    expect(parseToMinor('1.5', 'EUR')).toBe(150)
  })
  it(' "0.005" EUR → 1 (half-up rounding)', () => {
    expect(parseToMinor('0.005', 'EUR')).toBe(1)
  })
  it(' "0" EUR → 0', () => {
    expect(parseToMinor('0', 'EUR')).toBe(0)
  })
  it(' "  19.99 " trims and parses', () => {
    expect(parseToMinor('  19.99 ', 'EUR')).toBe(1999)
  })
  it(' "19,99" comma separator → 1999', () => {
    expect(parseToMinor('19,99', 'EUR')).toBe(1999)
  })
})

describe('parseToMinor — JPY 0dp', () => {
  it(' "1000" JPY → 1000', () => {
    expect(parseToMinor('1000', 'JPY')).toBe(1000)
  })
  it(' "1.5" JPY (0dp) → 2 (half-away-from-zero)', () => {
    expect(parseToMinor('1.5', 'JPY')).toBe(2)
  })
  it(' "0" JPY → 0', () => {
    expect(parseToMinor('0', 'JPY')).toBe(0)
  })
})

describe('parseToMinor — invalid inputs blocked', () => {
  it(' "abc" → null (invalid)', () => {
    expect(parseToMinor('abc', 'EUR')).toBeNull()
  })
  it(' "-50" → null (negative not allowed per nonnegative schema)', () => {
    expect(parseToMinor('-50', 'EUR')).toBeNull()
  })
  it(' "" empty → null', () => {
    expect(parseToMinor('', 'EUR')).toBeNull()
  })
  it(' "12.34.56" multiple decimals → null', () => {
    expect(parseToMinor('12.34.56', 'EUR')).toBeNull()
  })
  it(' "12a34" letters → null', () => {
    expect(parseToMinor('12a34', 'EUR')).toBeNull()
  })
})

describe('parseQuantity — raw quantity (not minor)', () => {
  it(' "2" → 2', () => {
    expect(parseQuantity('2')).toBe(2)
  })
  it(' "1.5" → 1.5', () => {
    expect(parseQuantity('1.5')).toBe(1.5)
  })
  it(' "0" → 0', () => {
    expect(parseQuantity('0')).toBe(0)
  })
  it(' "-50" → null', () => {
    expect(parseQuantity('-50')).toBeNull()
  })
  it(' "abc" → null', () => {
    expect(parseQuantity('abc')).toBeNull()
  })
  it(' "1,5" comma → 1.5', () => {
    expect(parseQuantity('1,5')).toBe(1.5)
  })
})

describe('minorToRaw — display for edit mode', () => {
  it(' 1999 EUR → "19.99"', () => {
    expect(minorToRaw(1999, 'EUR')).toBe('19.99')
  })
  it(' 150 EUR → "1.5"', () => {
    expect(minorToRaw(150, 'EUR')).toBe('1.5')
  })
  it(' 1000 JPY → "1000"', () => {
    expect(minorToRaw(1000, 'JPY')).toBe('1000')
  })
  it(' 0 EUR → "0"', () => {
    expect(minorToRaw(0, 'EUR')).toBe('0')
  })
})


describe('keystroke filter allowance (via isValid check)', () => {
  it('allows digits and single decimal, rejects letters', () => {
    expect(parseToMinor('12', 'EUR')).toBe(1200)
    expect(parseToMinor('12.5', 'EUR')).toBe(1250)
    expect(parseToMinor('12a', 'EUR')).toBeNull()
  })
  it('rejects multiple decimal separators', () => {
    expect(parseToMinor('1.2.3', 'EUR')).toBeNull()
  })
  it('rejects negative for nonnegative fields', () => {
    expect(parseToMinor('-1', 'EUR')).toBeNull()
    expect(parseQuantity('-1')).toBeNull()
  })
})
