import { Label } from '../ui/label'

// Native color input plus preset swatches taken from the active template.
export function ColorControl({
  label,
  value,
  swatches,
  onPick,
}: {
  label: string
  value: string
  swatches: string[]
  onPick: (hex: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onPick(event.target.value)}
          className="size-8 cursor-pointer rounded border border-input bg-transparent"
        />
        <div className="flex gap-1.5">
          {swatches.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${label}: ${color}`}
              onClick={() => onPick(color)}
              className="size-5 rounded-full ring-1 ring-inset ring-foreground/15"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
