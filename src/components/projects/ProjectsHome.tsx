import { Link, useNavigate } from '@tanstack/react-router'
import { getPlainText } from '../../document/richtext'
import { NewProjectForm } from './NewProjectForm'
import { useProjects } from './useProjects'

// Home screen: create a project, then open any of its documents.
export function ProjectsHome() {
  const { projects, createWithInvoice } = useProjects()
  const navigate = useNavigate()

  const create = async (title: string) => {
    const invoice = await createWithInvoice(title)
    await navigate({ to: '/documents/$documentId', params: { documentId: invoice.id } })
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
      <h1 className="text-xl font-semibold">Projects</h1>
      <NewProjectForm onCreate={(title) => void create(title)} />
      {projects?.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
      <ul className="flex flex-col gap-3">
        {projects?.map(({ project, documents }) => (
          <li key={project.id} className="rounded-lg border bg-card p-4">
            <h2 className="font-medium">{project.title}</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <Link to="/documents/$documentId" params={{ documentId: doc.id }} className="underline">
                    {doc.type} {getPlainText(doc.number) || 'draft'}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  )
}
