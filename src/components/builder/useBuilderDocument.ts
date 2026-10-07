import type { DocumentModel } from '../../document/types'
import { commitWithProjectData, type SharedData } from '../../project/sharedData'
import { blockActions } from '../blocks/blockActions'
import { useHistory } from '../edit/useHistory'
import type { OutlinePaneProps } from '../OutlinePane'
import type { PropertiesPaneProps } from '../PropertiesPane'
import { lineItemActions } from './lineItemActions'
import { useBuilderSelection } from './useBuilderSelection'
import { useDocumentSettings } from './useDocumentSettings'

// Wires history, settings, selection and line-item actions into the props the builder panes take.
export function useBuilderDocument(initialModel: DocumentModel, shared?: SharedData) {
  const history = useHistory(initialModel)
  const { model } = history
  const commit = (next: DocumentModel) => history.commit(commitWithProjectData(next, shared))
  const settings = useDocumentSettings(model, commit)
  const selection = useBuilderSelection()
  const items = lineItemActions(model, commit)
  const sections = blockActions(model, commit)

  const deleteItem = (id: string) => {
    items.deleteItem(id)
    selection.forgetItem(id)
  }

  const outlineProps: OutlinePaneProps = {
    model,
    selectedBlockId: selection.selectedBlockId,
    selectedItemId: selection.selectedItemId,
    onSelect: selection.select,
    onToggleVisibility: settings.toggleVisibility,
    onAddItem: items.addItem,
    onDuplicate: items.duplicateItem,
    onDelete: deleteItem,
    onReorder: items.reorderItems,
    onMoveUp: items.moveItemUp,
    onMoveDown: items.moveItemDown,
  }
  const sharedPropertiesProps: Omit<PropertiesPaneProps, 'selectedItemId'> = {
    model,
    template: settings.template ?? 'minimal',
    onTemplateChange: settings.changeTemplate,
    onBrandingChange: settings.changeBranding,
    onLogoChange: settings.changeLogo,
    onPageSizeChange: settings.changePageSize,
    onLineItemChange: items.changeLineItem,
    onValidUntilChange: (validUntil: string | undefined) => commit({ ...model, validUntil }),
    onDueDateChange: (dueDate: string | undefined) => commit({ ...model, dueDate }),
  }

  return { history: { ...history, commit }, settings, selection, items, sections, outlineProps, sharedPropertiesProps }
}
