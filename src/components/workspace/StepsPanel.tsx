import { useOpenDocument } from '../../hooks/useOpenDocument'
import { StepPicker } from '../project/StepPicker'
import { useProject } from '../project/useProject'
import { useWorkspace } from './workspaceContext'

// The open document's project pipeline; starting or opening a step switches the editor to it.
export function StepsPanel() {
  const { model } = useWorkspace()
  const { data, createDocument, toggleDone } = useProject(model.projectId)
  const openDocument = useOpenDocument()
  const project = data?.project
  if (!data || !project) return <div className="h-full bg-card p-3 text-sm text-muted-foreground">No project.</div>
  return (
    <div className="h-full overflow-y-auto bg-card p-3">
      <StepPicker
        documents={data.documents}
        doneSteps={project.doneSteps ?? []}
        onCreate={(type) => void createDocument(type).then((doc) => openDocument(doc))}
        onToggleDone={(type) => void toggleDone(project, type)}
      />
    </div>
  )
}
