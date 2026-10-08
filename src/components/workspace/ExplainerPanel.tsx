import type { IDockviewPanelProps } from 'dockview-react'
import { useOnTrue } from '../../hooks/useOnTrue'
import { ExplainerBanner } from '../explainer/ExplainerBanner'
import { useWorkspace } from './workspaceContext'

// What this pipeline step is for; once read or dismissed, the Properties tab comes forward.
export function ExplainerPanel({ containerApi }: IDockviewPanelProps) {
  const { model, showExplainer } = useWorkspace()
  const showProperties = () => containerApi.getPanel('properties')?.api.setActive()
  useOnTrue(!showExplainer, showProperties)
  return <div className="h-full overflow-y-auto bg-card pb-3">{showExplainer && <ExplainerBanner type={model.type} onSeen={showProperties} />}</div>
}
