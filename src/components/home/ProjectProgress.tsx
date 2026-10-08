import { DOC_TYPES } from '../../document/docTypes'
import { cn } from '@/lib/utils'

// The next step in words with "n of 10" over a thin bar: red when the project has a late invoice, green when complete.
export function ProjectProgress({ next, done, total, late }: { next: keyof typeof DOC_TYPES | null; done: number; total: number; late: boolean }) {
  return (
    <span className="grid justify-items-start gap-1.5 sm:justify-items-end">
      <span className="text-[12.5px] whitespace-nowrap text-muted-foreground">
        {next === null ? <b className="font-medium text-foreground">Complete</b> : <>Next: <b className="font-medium text-foreground">{DOC_TYPES[next].title}</b></>} · {done} of {total}
      </span>
      <span aria-hidden="true" className="h-1 w-30 overflow-hidden rounded-full bg-border">
        <span className={cn('block h-full rounded-full', late ? 'bg-destructive' : next === null ? 'bg-emerald-600' : 'bg-foreground')} style={{ width: `${(done / total) * 100}%` }} />
      </span>
    </span>
  )
}
