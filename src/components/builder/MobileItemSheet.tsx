import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { BottomSheet } from '../BottomSheet'
import { PropertiesPane, type PropertiesPaneProps } from '../PropertiesPane'
import { Button } from '../ui/button'

// Mobile bottom sheet with the tapped line item's properties and move buttons; desktop uses the right pane.
export function MobileItemSheet({
  model,
  sheetItemId,
  onClose,
  propertiesProps,
  onMoveUp,
  onMoveDown,
}: {
  model: DocumentModel
  sheetItemId: string | null
  onClose: () => void
  propertiesProps: Omit<PropertiesPaneProps, 'selectedItemId'>
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}) {
  const sheetItem = sheetItemId !== null ? model.lineItems.find((li) => li.id === sheetItemId) : null
  return (
    <BottomSheet open={sheetItemId !== null} onOpenChange={(open) => { if (!open) onClose() }} title={sheetItem ? (getPlainText(sheetItem.title) || 'Item') : 'Item'}>
      {sheetItem != null && (
        <div className="space-y-4">
          <PropertiesPane {...propertiesProps} selectedItemId={sheetItem.id} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onMoveUp(sheetItem.id)} disabled={model.lineItems.findIndex((li) => li.id === sheetItem.id) === 0}>
              Move up
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onMoveDown(sheetItem.id)}
              disabled={model.lineItems.findIndex((li) => li.id === sheetItem.id) === model.lineItems.length - 1}
            >
              Move down
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
