import { Plus, Zap } from 'lucide-react'
import { HOME_COPY } from '../../strings/home'
import { HomeRow } from './HomeRow'
import { HomeSection } from './HomeSection'

const Key = ({ k }: { k: string }) => <kbd className="hidden rounded px-1.5 font-mono text-[11px] text-muted-foreground shadow-[0_0_0_1px_var(--border)] sm:inline">{k}</kbd>

// Start a named or untitled project, or a quick invoice; a typed name in the command bar becomes the project title.
export function StartSection({ query, onNewProject, onQuickInvoice }: { query: string; onNewProject: () => void; onQuickInvoice: () => void }) {
  const title = query.trim()
  return (
    <HomeSection title={HOME_COPY.start}>
      <HomeRow icon={<Plus />} title={<button type="button" onClick={onNewProject}>{title ? HOME_COPY.newProjectNamed(title) : HOME_COPY.newProject}</button>} sub={HOME_COPY.newProjectHint} trailing={<Key k="N" />} />
      <HomeRow icon={<Zap />} title={<button type="button" onClick={onQuickInvoice}>{HOME_COPY.quickInvoice}</button>} sub={HOME_COPY.quickInvoiceHint} trailing={<Key k="I" />} />
    </HomeSection>
  )
}
