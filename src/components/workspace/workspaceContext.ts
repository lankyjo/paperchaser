import { createContext, useContext } from 'react'
import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import type { blockActions } from '../blocks/blockActions'
import type { OutlinePaneProps } from '../OutlinePane'
import type { PropertiesPaneProps } from '../PropertiesPane'

export interface WorkspaceState {
  model: DocumentModel
  template?: TemplateId
  pageSize: PageSize
  editable: boolean
  zoom: number
  sections: ReturnType<typeof blockActions>
  outlineProps: OutlinePaneProps
  propertiesProps: PropertiesPaneProps
  onCommit: (next: DocumentModel) => void
  onInsertItem?: (line: DocumentModel['lineItems'][number]) => void
  // Stored documents show the beginner explainer; previews and fixtures do not.
  showExplainer: boolean
}

// The open document and its actions, shared with every dockview panel.
export const WorkspaceContext = createContext<WorkspaceState | null>(null)

export function useWorkspace(): WorkspaceState {
  const state = useContext(WorkspaceContext)
  if (state === null) throw new Error('Workspace panels must render inside WorkspaceContext')
  return state
}
