export interface LabelValueRow {
  label: string
  value: number
}

export interface CsvParseResult {
  rows: LabelValueRow[]
  errors: { line: number; reason: string }[]
}

// Splits one CSV line on commas outside double quotes; quotes are removed.
function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (const ch of line) {
    if (ch === '"') quoted = !quoted
    else if (ch === ',' && !quoted) {
      cells.push(current)
      current = ''
    } else current += ch
  }
  return [...cells, current]
}

const toNumber = (raw: string) => (raw.trim() === '' ? NaN : Number(raw.replace(/[,\s]/g, '')))

// Reads pasted label,value data (CSV or spreadsheet tabs); a non-numeric first row is treated as a header.
export function parseLabelValueCsv(text: string): CsvParseResult {
  const result: CsvParseResult = { rows: [], errors: [] }
  text.split(/\r?\n/).forEach((line, idx) => {
    if (line.trim() === '') return
    const cells = line.includes('\t') ? line.split('\t') : splitCsvLine(line)
    if (cells.length < 2) return void result.errors.push({ line: idx + 1, reason: 'expected label,value' })
    const value = toNumber(cells[1])
    if (Number.isNaN(value)) {
      if (idx === 0) return
      return void result.errors.push({ line: idx + 1, reason: `value "${cells[1].trim()}" is not a number` })
    }
    result.rows.push({ label: cells[0].trim(), value })
  })
  return result
}
