import { Link, useNavigate } from '@tanstack/react-router'
import { useOpenDocument } from '../../hooks/useOpenDocument'
import { openInvoices } from '../../document/payments'
import { canDeleteProject } from '../../project/lifecycle'
import { isTaxModeLocked } from '../../project/sharedData'
import { exportProject } from '../../db/backupRepo'
import { downloadJson } from '../../lib/downloadFile'
import { UndoRedoButtons } from '../builder/UndoRedoButtons'
import { Button } from '../ui/button'
import { ClientPicker } from './ClientPicker'
import { ProjectDetailsForm } from './ProjectDetailsForm'
import { ProjectStatusSection } from './ProjectStatusSection'
import { StepPicker } from './StepPicker'
import { useProject } from './useProject'

// A project's status, pipeline steps, client and shared details; archived projects are read-only.
export function ProjectPage({ projectId }: { projectId: string }) {
  const { data, save, createClientFor, createDocument, toggleDone, remove, undo, redo, canUndo, canRedo, historySteps } = useProject(projectId)
  const navigate = useNavigate()
  const openDocument = useOpenDocument()
  if (data === null) return null
  const { project, documents, clients } = data
  if (project === null) return <p className="p-6 text-sm">Project not found.</p>
  const title = project.title || 'Untitled project'

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
      <div className="flex items-center justify-between">
        <Link to="/app" className="text-sm underline">
          Projects
        </Link>
        <Button size="sm" variant="outline" className="ml-auto mr-2" onClick={() => void exportProject(project.id).then((b) => downloadJson(`${title}.paperchaser.json`, b))}>
          Export project
        </Button>
        <UndoRedoButtons className="flex items-center gap-1" canUndo={canUndo} canRedo={canRedo} onUndo={() => void undo()} onRedo={() => void redo()} />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      {project.archived && <p role="status" className="text-sm text-muted-foreground">Archived — unarchive to make changes.</p>}
      <ProjectStatusSection
        project={project}
        canDelete={project.sample === true || canDeleteProject(documents)}
        openInvoices={openInvoices(documents).map((o) => o.invoice)}
        onSave={(next) => void save(next)}
        onDelete={() => void remove().then(() => navigate({ to: '/app' }))}
      />
      <fieldset disabled={project.archived} className="contents">
        <StepPicker
          documents={documents}
          doneSteps={project.doneSteps ?? []}
          onCreate={(type) =>
            void createDocument(type).then((doc) => openDocument(doc))
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
          <ProjectDetailsForm key={`${project.id}-${historySteps}`} project={project} taxModeLocked={isTaxModeLocked(documents)} onSave={(next) => void save(next)} />
        </section>
      </fieldset>
    </main>
  )
}
