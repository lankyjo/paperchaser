import type { DockviewApi } from 'dockview-react'
import { CanvasPanel } from './CanvasPanel'
import { ExplainerPanel } from './ExplainerPanel'
import { OutlinePanel } from './OutlinePanel'
import { ProjectsPanel } from './ProjectsPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { StepsPanel } from './StepsPanel'

// Every workspace panel: its tab title and component; the key is both the panel id and the component name.
export const WORKSPACE_PANELS = {
  outline: { title: 'Outline', component: OutlinePanel },
  canvas: { title: 'Document', component: CanvasPanel },
  properties: { title: 'Properties', component: PropertiesPanel },
  explainer: { title: 'About this step', component: ExplainerPanel },
  steps: { title: 'Pipeline', component: StepsPanel },
  projects: { title: 'Projects', component: ProjectsPanel },
}

type PanelId = keyof typeof WORKSPACE_PANELS

export const PANEL_COMPONENTS = Object.fromEntries(Object.entries(WORKSPACE_PANELS).map(([id, panel]) => [id, panel.component]))

const add = (api: DockviewApi, id: PanelId, position?: Parameters<DockviewApi['addPanel']>[0]['position'], size?: { initialWidth?: number; minimumWidth?: number }) =>
  api.addPanel({ id, component: id, title: WORKSPACE_PANELS[id].title, renderer: 'always', ...(position && { position }), ...size })

// Two full-height side columns with tabs, so no panel is squeezed: outline, pipeline and projects left; properties and the explainer right.
export function addDefaultPanels(api: DockviewApi) {
  add(api, 'canvas', undefined, { minimumWidth: 420 })
  add(api, 'outline', { referencePanel: 'canvas', direction: 'left' }, { initialWidth: 280, minimumWidth: 220 })
  add(api, 'steps', { referencePanel: 'outline', direction: 'within' })
  add(api, 'projects', { referencePanel: 'outline', direction: 'within' })
  add(api, 'properties', { referencePanel: 'canvas', direction: 'right' }, { initialWidth: 300, minimumWidth: 240 })
  add(api, 'explainer', { referencePanel: 'properties', direction: 'within' })
  api.getPanel('outline')?.api.setActive()
  api.getPanel('explainer')?.api.setActive()
  api.getPanel('canvas')?.api.setActive()
}
