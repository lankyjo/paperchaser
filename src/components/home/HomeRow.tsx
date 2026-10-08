import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RowTone = 'plain' | 'late' | 'ready'

interface HomeRowProps {
  icon: ReactNode
  // The row's main control (a link or button); it stretches over the whole row so the row is one big target.
  title: ReactNode
  sub?: ReactNode
  trailing?: ReactNode
  action?: ReactNode
  tone?: RowTone
}

const TONES: Record<RowTone, { row: string; chip: string; sub: string }> = {
  plain: { row: 'hover:bg-muted', chip: 'bg-muted text-muted-foreground', sub: 'text-muted-foreground' },
  late: { row: 'bg-destructive/10 hover:bg-destructive/15', chip: 'bg-destructive text-background', sub: 'text-destructive' },
  ready: { row: 'hover:bg-muted', chip: 'bg-gold/20 text-foreground', sub: 'text-muted-foreground' },
}

// One line of the home command center: icon chip, title and detail, an optional value and an optional action.
export function HomeRow({ icon, title, sub, trailing, action, tone = 'plain' }: HomeRowProps) {
  const t = TONES[tone]
  return (
    <li className={cn('relative grid grid-cols-[30px_1fr] items-center gap-x-3 gap-y-1 rounded-[10px] px-3 py-2.5 transition-colors sm:grid-cols-[30px_1fr_auto_auto]', t.row)}>
      <span aria-hidden="true" className={cn('grid size-[30px] place-items-center rounded-lg [&_svg]:size-4', t.chip)}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-medium [&>a]:after:absolute [&>a]:after:inset-0 [&>a]:after:rounded-[10px] [&>button]:after:absolute [&>button]:after:inset-0 [&>button]:after:rounded-[10px]">{title}</span>
        {sub && <span className={cn('block text-[12.5px]', t.sub)}>{sub}</span>}
      </span>
      {trailing !== undefined && <span className="col-start-2 sm:col-start-auto">{trailing}</span>}
      {action && <span className="relative z-10 col-start-2 sm:col-start-auto">{action}</span>}
    </li>
  )
}
