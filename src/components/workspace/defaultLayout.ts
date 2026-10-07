import type { DockviewApi } from 'dockview-react'

// Panel id to tab title; the ids are also the component names.
export const WORKSPACE_PANELS = {
  outline: 'Outline',
  canvas: 'Document',
  properties: 'Properties',
  explainer: 'About this step',
  steps: 'Pipeline',
  projects: 'Projects',
} as const

export type WorkspacePanelId = keyof typeof WORKSPACE_PANELS

const add = (api: DockviewApi, id: WorkspacePanelId, position?: Parameters<DockviewApi['addPanel']>[0]['position'], size?: { initialWidth?: number; initialHeight?: number }) =>
  api.addPanel({ id, component: id, title: WORKSPACE_PANELS[id], renderer: 'always', ...(position && { position }), ...size })

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
