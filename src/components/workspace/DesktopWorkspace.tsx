import { DockviewDefaultTab, DockviewReact, type IDockviewPanelHeaderProps } from 'dockview-react'
import 'dockview-react/dist/styles/dockview.css'
import { PANEL_COMPONENTS } from './defaultLayout'
import { MaximizeAction } from './MaximizeAction'
import { useWorkspaceLayout } from './useWorkspaceLayout'
import './workspace.css'

const THEME = { name: 'paperchaser', className: 'dockview-theme-light paperchaser-dock' }

// Tabs without a close button, so no panel can be lost; panels still drag, split and maximize.
const Tab = (props: IDockviewPanelHeaderProps) => <DockviewDefaultTab {...props} hideClose />

// Desktop editor: every panel docks, splits and maximizes, and the layout is remembered.
export function DesktopWorkspace() {
  const { loaded, onReady } = useWorkspaceLayout()
  if (!loaded) return null
  return (
    // isolate keeps dockview's internal z-indexes below dialogs and menus.
    <div className="isolate min-h-0 flex-1 print:hidden">
      <DockviewReact components={PANEL_COMPONENTS} defaultTabComponent={Tab} rightHeaderActionsComponent={MaximizeAction} theme={THEME} onReady={onReady} />
    </div>
  )
}
