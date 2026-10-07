import { describe, expect, it } from 'vitest'

import { parseLabelValueCsv } from '../csv'

describe('parseLabelValueCsv', () => {
  it('reads label,value rows, skipping a header row and blank lines', () => {
    expect(parseLabelValueCsv('Month,Views\nJan,1200\n\nFeb,"1,450"\n')).toEqual({
      rows: [
        { label: 'Jan', value: 1200 },
        { label: 'Feb', value: 1450 },
      ],
      errors: [],
    })
  })

  it('reports bad rows by line instead of silently dropping them', () => {
    expect(parseLabelValueCsv('Jan,12\nFeb,lots\nMar')).toEqual({
      rows: [{ label: 'Jan', value: 12 }],
      errors: [
        { line: 2, reason: 'value "lots" is not a number' },
        { line: 3, reason: 'expected label,value' },
      ],
    })
  })

  it('accepts tabs, so cells pasted from a spreadsheet work', () => {
    expect(parseLabelValueCsv('Jan\t5\nFeb\t7.5').rows).toEqual([
      { label: 'Jan', value: 5 },
      { label: 'Feb', value: 7.5 },
    ])
  })
})
