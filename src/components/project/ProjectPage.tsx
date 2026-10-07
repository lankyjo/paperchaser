import { Link } from '@tanstack/react-router'
import { getPlainText } from '../../document/richtext'
import { ClientPicker } from './ClientPicker'
import { ProjectDetailsForm } from './ProjectDetailsForm'
import { useProject } from './useProject'

// A project's shared details, client and documents.
export function ProjectPage({ projectId }: { projectId: string }) {
  const { data, save, createClientFor } = useProject(projectId)
  if (data === null) return null
  const { project, documents, clients } = data
  if (project === null) return <p className="p-6 text-sm">Project not found.</p>
  const title = project.title || 'Untitled project'

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
      <Link to="/" className="text-sm underline">
        Projects
      </Link>
      <h1 className="text-xl font-semibold">{title}</h1>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-medium">Client</h2>
        <ClientPicker
          projectTitle={title}
          clientId={project.clientId}
          clients={clients}
          onPick={(clientId) => void save({ ...project, clientId })}
          onCreate={(name) => void createClientFor(project, name)}
        />
      </section>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-medium">Project details</h2>
        <ProjectDetailsForm key={project.id} project={project} onSave={(next) => void save(next)} />
      </section>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-medium">Documents</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link to="/documents/$documentId" params={{ documentId: doc.id }} className="underline">
                {doc.type} {getPlainText(doc.number) || 'draft'}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
