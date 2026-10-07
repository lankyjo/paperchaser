import { useState } from 'react'
import { parseLabelValueCsv, type CsvParseResult, type LabelValueRow } from '../../document/csv'
import { Button } from '../ui/button'

// Paste label,value rows from a spreadsheet; bad lines are listed instead of dropped silently.
export function CsvPaste({ onApply }: { onApply: (rows: LabelValueRow[]) => void }) {
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<CsvParseResult['errors']>([])
  const apply = () => {
    const result = parseLabelValueCsv(text)
    setErrors(result.errors)
    if (result.rows.length > 0) onApply(result.rows)
  }
  return (
    <div className="mt-2 flex flex-col gap-1 print:hidden">
      <textarea
        aria-label="Paste CSV"
        placeholder="Paste label,value rows"
        className="min-h-16 rounded-md border bg-transparent px-2 py-1 text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button size="sm" variant="outline" className="self-start" disabled={text.trim() === ''} onClick={apply}>
        Use pasted data
      </Button>
      {errors.map((e) => (
        <p key={e.line} role="alert" className="text-[11px] text-destructive">
          Line {e.line}: {e.reason}
        </p>
      ))}
    </div>
  )
}
