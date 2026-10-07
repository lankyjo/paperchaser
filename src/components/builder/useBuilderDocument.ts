import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import type { RichTextDoc } from '../../document/richtext'
import { useHistory } from '../edit/useHistory'
import type { OutlinePaneProps } from '../OutlinePane'
import type { PropertiesPaneProps } from '../PropertiesPane'
import { lineItemActions } from './lineItemActions'
import { useBuilderSelection } from './useBuilderSelection'
import { useDocumentSettings } from './useDocumentSettings'

// Wires history, settings, selection and line-item actions into the props the builder panes take.
export function useBuilderDocument(initialModel: DocumentModel, initialTemplate?: TemplateId, initialPageSize?: PageSize) {
  const history = useHistory(initialModel)
  const { model, commit } = history
  const settings = useDocumentSettings(model, commit, initialTemplate, initialPageSize)
  const selection = useBuilderSelection()
  const items = lineItemActions(model, commit)

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
    onCurrencyChange: settings.changeCurrency,
    onLineItemChange: items.changeLineItem,
  }

  return { history, settings, selection, items, outlineProps, sharedPropertiesProps, commitCustomerName }
}
