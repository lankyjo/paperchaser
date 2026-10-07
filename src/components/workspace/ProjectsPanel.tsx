import { Link } from '@tanstack/react-router'
import { useProjectList } from './useProjectList'

// Every project, to jump between them without leaving the workspace.
export function ProjectsPanel() {
  const projects = useProjectList()
  return (
    <nav aria-label="All projects" className="h-full overflow-y-auto bg-card p-3">
      <ul className="flex flex-col gap-1 text-sm">
        {projects.map((project) => (
          <li key={project.id}>
            <Link to="/projects/$projectId" params={{ projectId: project.id }} className="block rounded px-2 py-1 hover:bg-muted">
              {project.title || 'Untitled project'}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
