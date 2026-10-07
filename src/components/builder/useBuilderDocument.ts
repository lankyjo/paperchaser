import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import type { RichTextDoc } from '../../document/richtext'
import { trackOverrides, type SharedData } from '../../project/sharedData'
import { blockActions } from '../blocks/blockActions'
import { useHistory } from '../edit/useHistory'
import type { OutlinePaneProps } from '../OutlinePane'
import type { PropertiesPaneProps } from '../PropertiesPane'
import { lineItemActions } from './lineItemActions'
import { useBuilderSelection } from './useBuilderSelection'
import { useDocumentSettings } from './useDocumentSettings'

// Wires history, settings, selection and line-item actions into the props the builder panes take.
export function useBuilderDocument(
  initialModel: DocumentModel,
  initialTemplate?: TemplateId,
  initialPageSize?: PageSize,
  shared?: SharedData,
) {
  const history = useHistory(initialModel)
  const { model } = history
  // Every edit inside a project re-derives which shared fields this document overrides.
  const commit = (next: DocumentModel) => history.commit(shared ? trackOverrides(next, shared) : next)
  const settings = useDocumentSettings(model, commit, initialTemplate, initialPageSize)
  const selection = useBuilderSelection()
  const items = lineItemActions(model, commit)
  const sections = blockActions(model, commit)

  const commitCustomerName = (name: RichTextDoc) => commit({ ...model, customer: { ...model.customer, name } })
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
    template: settings.currentTemplate ?? model.template ?? 'minimal',
    onTemplateChange: settings.changeTemplate,
    onBrandingChange: settings.changeBranding,
    onLogoChange: settings.changeLogo,
    onPageSizeChange: settings.changePageSize,
    onLineItemChange: items.changeLineItem,
  }

  return { history: { ...history, commit }, settings, selection, items, sections, outlineProps, sharedPropertiesProps, commitCustomerName }
}
