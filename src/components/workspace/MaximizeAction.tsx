import { Maximize2, Minimize2 } from 'lucide-react'
import { useState } from 'react'
import type { IDockviewHeaderActionsProps } from 'dockview-react'

// Header button that fills the workspace with this panel group, or restores the layout.
export function MaximizeAction({ api }: IDockviewHeaderActionsProps) {
  const [maximized, setMaximized] = useState(api.isMaximized())
  const toggle = () => {
    if (api.isMaximized()) api.exitMaximized()
    else api.maximize()
    setMaximized(api.isMaximized())
  }
  const Icon = maximized ? Minimize2 : Maximize2
  return (
    <button type="button" aria-label={maximized ? 'Restore panel size' : 'Maximize panel'} className="flex h-full items-center px-2 text-muted-foreground hover:text-foreground" onClick={toggle}>
      <Icon className="size-3.5" aria-hidden="true" />
    </button>
  )
}
