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

const add = (api: DockviewApi, id: PanelId, position?: Parameters<DockviewApi['addPanel']>[0]['position'], size?: { initialWidth?: number; initialHeight?: number }) =>
  api.addPanel({ id, component: id, title: WORKSPACE_PANELS[id].title, renderer: 'always', ...(position && { position }), ...size })

// Outline left with the pipeline and projects under it, the page in the middle, the explainer above properties on the right.
export function addDefaultPanels(api: DockviewApi) {
  add(api, 'canvas')
  add(api, 'outline', { referencePanel: 'canvas', direction: 'left' }, { initialWidth: 250 })
  add(api, 'properties', { referencePanel: 'canvas', direction: 'right' }, { initialWidth: 290 })
  add(api, 'explainer', { referencePanel: 'properties', direction: 'above' }, { initialHeight: 220 })
  add(api, 'steps', { referencePanel: 'outline', direction: 'below' }, { initialHeight: 220 })
  add(api, 'projects', { referencePanel: 'steps', direction: 'within' })
  api.getPanel('steps')?.api.setActive()
  api.getPanel('canvas')?.api.setActive()
}
