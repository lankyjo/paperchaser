import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

// Labelled select bound to one branding enum field.
export function SelectControl({
  label,
  value,
  options,
  onPick,
}: {
  label: string
  value: string | null
  options: ReadonlyArray<{ value: string; label: string }>
  onPick: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null && typeof next === 'string') onPick(next)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
