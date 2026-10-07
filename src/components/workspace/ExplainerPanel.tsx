import { ExplainerBanner } from '../explainer/ExplainerBanner'
import { useWorkspace } from './workspaceContext'

// What this pipeline step is for, for people new to freelancing.
export function ExplainerPanel() {
  const { model, showExplainer } = useWorkspace()
  return <div className="h-full overflow-y-auto bg-card pb-3">{showExplainer && <ExplainerBanner type={model.type} />}</div>
}
