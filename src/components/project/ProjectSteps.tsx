import { useOpenDocument } from '../../hooks/useOpenDocument'
import { StepPicker } from './StepPicker'
import { useProject } from './useProject'

// A project's pipeline steps; starting or opening a step opens that document.
export function ProjectSteps({ projectId }: { projectId: string }) {
  const { data, createDocument, toggleDone } = useProject(projectId)
  const openDocument = useOpenDocument()
  const project = data?.project
  if (!data || !project) return <p className="text-sm text-muted-foreground">No project.</p>
  return (
    <StepPicker
      documents={data.documents}
      doneSteps={project.doneSteps ?? []}
      onCreate={(type) => void createDocument(type).then((doc) => openDocument(doc))}
      onToggleDone={(type) => void toggleDone(project, type)}
    />
  )
}
