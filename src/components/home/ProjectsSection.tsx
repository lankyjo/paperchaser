import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { nextStep } from '../../project/homeTasks'
import { HOME_COPY } from '../../strings/home'
import type { ProjectWithDocuments } from './useProjects'
import { HomeRow } from './HomeRow'
import { HomeSection } from './HomeSection'
import { ProjectProgress } from './ProjectProgress'

interface ProjectsSectionProps {
  entries: ProjectWithDocuments[]
  clientNames: Map<string, string>
  lateProjectIds: Set<string>
  showArchived: boolean
  onShowArchived: (show: boolean) => void
  emptyText: string
}

// Every matching project with its client and its next step in words.
export function ProjectsSection({ entries, clientNames, lateProjectIds, showArchived, onShowArchived, emptyText }: ProjectsSectionProps) {
  return (
    <HomeSection
      title={HOME_COPY.projects}
      aside={
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <input type="checkbox" checked={showArchived} onChange={(e) => onShowArchived(e.target.checked)} />
          Show archived
        </label>
      }
    >
      {entries.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</li>}
      {entries.map(({ project, documents }) => {
        const client = project.clientId ? clientNames.get(project.clientId) : undefined
        const sub = [client ?? project.prospectName, project.sample ? 'sample' : undefined, project.archived ? 'archived' : undefined].filter(Boolean).join(' · ')
        return (
          <HomeRow
            key={project.id}
            icon={<FileText />}
            title={<Link to="/projects/$projectId" params={{ projectId: project.id }}>{project.title || 'Untitled project'}</Link>}
            sub={sub || undefined}
            trailing={<ProjectProgress {...nextStep(documents, project.doneSteps ?? [])} late={lateProjectIds.has(project.id)} />}
          />
        )
      })}
    </HomeSection>
  )
}
