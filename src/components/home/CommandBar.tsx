import { Search } from 'lucide-react'
import type { RefObject } from 'react'
import { HOME_COPY } from '../../strings/home'

// The search-or-create field: typing filters projects, Enter opens the match or creates a project with that name.
export function CommandBar({ inputRef, query, onQuery, onSubmit }: { inputRef: RefObject<HTMLInputElement | null>; query: string; onQuery: (q: string) => void; onSubmit: () => void }) {
  return (
    <form
      role="search"
      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-[0_0_0_1px_var(--border),0_8px_24px_-8px_oklch(0.3_0.02_70/0.12)] focus-within:shadow-[0_0_0_2px_var(--ring)]"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input ref={inputRef} value={query} onChange={(e) => onQuery(e.target.value)} aria-label={HOME_COPY.search} placeholder={HOME_COPY.search} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
      <kbd className="hidden rounded px-1.5 font-mono text-[11px] text-muted-foreground shadow-[0_0_0_1px_var(--border)] sm:inline">⌘K</kbd>
    </form>
  )
}
