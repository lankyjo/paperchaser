import { Check } from 'lucide-react'

import { resolveTokens } from '../document/resolveTokens'
import { TEMPLATE_REGISTRY } from '../document/tokens'
import type { TemplateId } from '../document/tokens'
import { cn } from '@/lib/utils'

// Template picker cards showing each template's name and ink/primary/accent swatches.
const TEMPLATE_CARDS: Array<{ id: TemplateId; name: string }> = Object.keys(TEMPLATE_REGISTRY).map((id) => ({
  id: id as TemplateId,
  name: id.charAt(0).toUpperCase() + id.slice(1),
}))

export function TemplateGallery({
  selected,
  onSelect,
}: {
  selected: TemplateId
  onSelect: (template: TemplateId) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Template gallery">
      {TEMPLATE_CARDS.map((card) => {
        const resolved = resolveTokens(card.id)
        const active = card.id === selected
        return (
          <button
            key={card.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(card.id)}
            className={cn(
              'flex flex-col gap-1.5 rounded-lg border p-2 text-left text-sm transition-all outline-none',
              'bg-card focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'border-primary ring-2 ring-primary/40'
                : 'border-border hover:border-foreground/40 hover:bg-muted/50',
            )}
          >
            <span className="flex items-center justify-between gap-1">
              <span className="truncate font-medium">{card.name}</span>
              {active && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </span>
            <span className="flex gap-1" aria-hidden="true">
              <Swatch color={resolved.palette.ink} />
              <Swatch color={resolved.palette.primary ?? resolved.palette.ink} />
              <Swatch color={resolved.accent} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="size-3 rounded-full ring-1 ring-inset ring-foreground/15"
      style={{ backgroundColor: color }}
    />
  )
}
