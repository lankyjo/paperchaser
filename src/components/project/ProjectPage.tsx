import { Link, useNavigate } from '@tanstack/react-router'
import { ClientPicker } from './ClientPicker'
import { ProjectDetailsForm } from './ProjectDetailsForm'
import { StepPicker } from './StepPicker'
import { useProject } from './useProject'

// A project's shared details, client and documents.
export function ProjectPage({ projectId }: { projectId: string }) {
  const { data, save, createClientFor, createDocument, toggleDone } = useProject(projectId)
  const navigate = useNavigate()
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
      <StepPicker
        documents={documents}
        doneSteps={project.doneSteps ?? []}
        onCreate={(type) =>
          void createDocument(type).then((doc) => navigate({ to: '/documents/$documentId', params: { documentId: doc.id } }))
        }
        onToggleDone={(type) => void toggleDone(project, type)}
      />
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
    </main>
  )
}
