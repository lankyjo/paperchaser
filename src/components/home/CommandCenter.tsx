import { HOME_COPY } from '../../strings/home'
import { DataSafetyNotices } from '../data-safety/DataSafetyNotices'
import { CommandBar } from './CommandBar'
import { HomeHeader } from './HomeHeader'
import { LateBanner } from './LateBanner'
import { LateSection } from './LateSection'
import { ProjectsSection } from './ProjectsSection'
import { ReadySection } from './ReadySection'
import { StartSection } from './StartSection'
import { useHomeCommand } from './useHomeCommand'
import { WorkspaceSection } from './WorkspaceSection'

// What needs attention first (late, then ready to send), then starting work, projects and the workspace.
export function CommandCenter() {
  const c = useHomeCommand()
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6 pb-24 text-sm sm:px-7">
      <HomeHeader />
      <DataSafetyNotices />
      <LateBanner overdue={c.home.overdue} />
      <CommandBar inputRef={c.inputRef} query={c.query} onQuery={c.setQuery} onSubmit={c.submit} />
      <div>
        <LateSection overdue={c.home.overdue} />
        <ReadySection receipts={c.home.receipts} />
        <StartSection query={c.query} onNewProject={c.newProject} onQuickInvoice={c.quickInvoice} />
        <ProjectsSection
          entries={c.entries}
          clientNames={c.home.clientNames}
          lateProjectIds={c.lateProjectIds}
          showArchived={c.showArchived}
          onShowArchived={c.setShowArchived}
          emptyText={c.home.projects?.length === 0 ? HOME_COPY.noProjects : HOME_COPY.noMatches}
        />
        <WorkspaceSection />
      </div>
    </main>
  )
}
