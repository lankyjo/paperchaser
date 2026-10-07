import { useState } from 'react'
import type { DockviewReadyEvent, SerializedDockview } from 'dockview-react'
import { preferencesRepo } from '../../db/repos'
import { useMountEffect } from '../../hooks/useMountEffect'
import { isRestorableLayout } from '../../lib/workspaceLayout'
import { addDefaultPanels, WORKSPACE_PANELS } from './defaultLayout'

const LAYOUT_KEY = 'workspaceLayout'

// Loads the saved panel layout before dockview mounts, restores it (or the default) and saves every change.
export function useWorkspaceLayout() {
  const [saved, setSaved] = useState<unknown>(undefined)
  const [loaded, setLoaded] = useState(false)
  useMountEffect(() => {
    void preferencesRepo.get(LAYOUT_KEY).then((layout) => {
      setSaved(layout)
      setLoaded(true)
    })
  })

  const onReady = ({ api }: DockviewReadyEvent) => {
    let restored = false
    if (isRestorableLayout(saved, Object.keys(WORKSPACE_PANELS))) {
      try {
        api.fromJSON(saved as SerializedDockview)
        restored = true
      } catch {
        api.clear()
      }
    }
    if (!restored) addDefaultPanels(api)
    api.onDidLayoutChange(() => void preferencesRepo.put(LAYOUT_KEY, api.toJSON()))
  }

  return { loaded, onReady }
}
