import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '../ui/button'
import { NewProjectForm } from './NewProjectForm'
import { ProjectCard } from './ProjectCard'
import { useProjects } from './useProjects'

// Home screen: create a project, then open any of its documents.
export function ProjectsHome() {
  const { projects, clients, createWithInvoice, assignClient, createClientFor } = useProjects()
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
        <Button variant="outline" onClick={() => void create('')}>
          Quick invoice
        </Button>
      </div>
      <NewProjectForm onCreate={(title) => void create(title)} />
      {projects?.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
      <ul className="flex flex-col gap-3">
        {projects?.map((entry) => (
          <ProjectCard
            key={entry.project.id}
            entry={entry}
            clients={clients}
            onPickClient={(clientId) => void assignClient(entry.project, clientId)}
            onCreateClient={(name) => void createClientFor(entry.project, name)}
          />
        ))}
      </ul>
    </main>
  )
}
