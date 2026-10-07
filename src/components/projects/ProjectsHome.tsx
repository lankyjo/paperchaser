import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { filterProjects } from '../../project/searchProjects'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { NewProjectForm } from './NewProjectForm'
import { ProjectCard } from './ProjectCard'
import { useProjects } from './useProjects'

// Home screen: create a project, then open any of its documents.
export function ProjectsHome() {
  const { projects, clientNames, createWithInvoice } = useProjects()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const visible = projects === null ? [] : filterProjects(projects.map((e) => ({ ...e.project, entry: e })), clientNames, query, showArchived)
  const navigate = useNavigate()

  const create = async (title: string) => {
    const invoice = await createWithInvoice(title)
    await navigate({ to: '/documents/$documentId', params: { documentId: invoice.id } })
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link to="/clients" className="ml-auto mr-3 text-sm underline">
          Clients
        </Link>
        <Link to="/settings" className="mr-3 text-sm underline">
          Settings
        </Link>
        <Button variant="outline" onClick={() => void create('')}>
          Quick invoice
        </Button>
      </div>
      <NewProjectForm onCreate={(title) => void create(title)} />
      <div className="flex items-center gap-3">
        <Input aria-label="Search projects" placeholder="Search by project or client" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="flex shrink-0 items-center gap-1 text-sm">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>
      {projects?.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
      <ul className="flex flex-col gap-3">
        {visible.map(({ entry }) => (
          <ProjectCard key={entry.project.id} entry={entry} />
        ))}
      </ul>
    </main>
  )
}
