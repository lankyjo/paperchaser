import type { ReactNode } from 'react'

// A titled group of home rows; label sets the region name when the group is a landmark.
export function HomeSection({ title, label, aside, children }: { title: string; label?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={label ?? title} className="grid gap-0.5">
      <div className="flex items-center justify-between px-3 pt-4 pb-1.5">
        <h2 className="text-[11.5px] font-medium text-muted-foreground">{title}</h2>
        {aside}
      </div>
      <ul className="grid gap-0.5">{children}</ul>
    </section>
  )
}
