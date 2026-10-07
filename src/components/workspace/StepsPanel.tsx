import { ProjectSteps } from '../project/ProjectSteps'
import { useWorkspace } from './workspaceContext'

// The open document's project pipeline.
export function StepsPanel() {
  return (
    <div className="h-full overflow-y-auto bg-card p-3">
      <ProjectSteps projectId={useWorkspace().model.projectId} />
    </div>
  )
}
