import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface CommitFieldProps {
  label: string
  value: string
  onCommit: (raw: string) => void
  multiline?: boolean
  inputMode?: 'decimal' | 'text'
  disabled?: boolean
}

// A labelled field that saves on blur or Enter; it resets whenever the value changes elsewhere, such as on the canvas.
export function CommitField({ label, value, onCommit, multiline = false, inputMode = 'text', disabled = false }: CommitFieldProps) {
  const id = `field-${label.toLowerCase().replace(/\W+/g, '-')}`
  const commit = (raw: string) => raw !== value && onCommit(raw)
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      {multiline ? (
        <textarea key={value} id={id} disabled={disabled} defaultValue={value} rows={3} onBlur={(e) => commit(e.target.value)} className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
      ) : (
        <Input key={value} id={id} disabled={disabled} defaultValue={value} inputMode={inputMode} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      )}
    </div>
  )
}
