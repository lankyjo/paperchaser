import type { Branding } from '../../document/types'
import { Label } from '../ui/label'
import { WATERMARK_OPTIONS } from './brandingOptions'

// Radio group choosing the watermark: derived from status, or forced to Draft or Paid.
export function WatermarkControl({
  watermark,
  onPick,
}: {
  watermark: string
  onPick: (watermark: Branding['watermark']) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>Watermark</Label>
      <div className="flex gap-3" role="radiogroup" aria-label="Watermark">
        {WATERMARK_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="watermark"
              value={option.value}
              checked={watermark === option.value}
              onChange={() => onPick(option.value as Branding['watermark'])}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}
