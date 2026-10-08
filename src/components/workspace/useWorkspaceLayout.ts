import { useState } from 'react'
import type { DockviewReadyEvent, SerializedDockview } from 'dockview-react'
import { preferencesRepo } from '../../db/repos'
import { useMountEffect } from '../../hooks/useMountEffect'
import { isRestorableLayout } from '../../lib/workspaceLayout'
import { addDefaultPanels, WORKSPACE_PANELS } from './defaultLayout'

const LAYOUT_KEY = 'workspaceLayout.v2'

// Kept in memory after the first read, so opening another document draws the panels in the same frame.
let memo: { layout: unknown } | null = null

// Loads the saved panel layout before dockview mounts, restores it (or the default) and saves every change.
export function useWorkspaceLayout() {
  const [saved, setSaved] = useState(memo)
  useMountEffect(() => {
    if (!memo) void preferencesRepo.get(LAYOUT_KEY).then((layout) => setSaved((memo = { layout })))
  })

  const onReady = ({ api }: DockviewReadyEvent) => {
    let restored = false
    if (isRestorableLayout(saved?.layout, Object.keys(WORKSPACE_PANELS))) {
      try {
        api.fromJSON(saved?.layout as SerializedDockview)
        restored = true
      } catch {
        api.clear()
      }
    }
    if (!restored) addDefaultPanels(api)
    // Saved on every change, so a reload right after a change never loses it.
    api.onDidLayoutChange(() => {
      memo = { layout: api.toJSON() }
      void preferencesRepo.put(LAYOUT_KEY, memo.layout)
    })
  }

  return { loaded: saved !== null, onReady }
}
