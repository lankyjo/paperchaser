import { Check } from 'lucide-react'

import { TEMPLATE_NAMES } from '../document/tokens'
import type { TemplateId } from '../document/tokens'
import { cn } from '@/lib/utils'
import { TemplateThumbnail } from './templates/TemplateThumbnail'

// Template picker cards: a small sample page in each template, with its name.
const TEMPLATE_CARDS = (Object.entries(TEMPLATE_NAMES) as Array<[TemplateId, string]>).map(([id, name]) => ({ id, name }))

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
            <TemplateThumbnail template={card.id} />
            <span className="flex items-center justify-between gap-1">
              <span className="truncate font-medium">{card.name}</span>
              {active && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

