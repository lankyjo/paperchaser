import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ItemImageField } from './ItemImageField'

// Read-only summary of the selected line item plus its image field; text is edited on the canvas.
export function ItemProperties({
  item,
  onLineItemChange,
}: {
  item: DocumentModel['lineItems'][number]
  onLineItemChange?: (id: string, patch: Partial<DocumentModel['lineItems'][number]>) => void
}) {
  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Title</p>
            <p className="text-sm">{getPlainText(item.title) || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{getPlainText(item.description) || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="text-sm">{item.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit price</p>
              <p className="text-sm">{(item.unitPriceMinor / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tax</p>
              <p className="text-sm">{(item.taxRateMinor / 100).toFixed(2)}%</p>
            </div>
            {item.discount !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Discount</p>
                <p className="text-sm">{item.discount.kind === 'percent' ? `${(item.discount.value / 100).toFixed(2)}%` : `${(item.discount.value / 100).toFixed(2)}`}</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">Editing happens inline on the canvas.</p>
          <ItemImageField image={item.image} onChange={(dataUrl) => onLineItemChange?.(item.id, { image: dataUrl ?? undefined })} onRemove={() => onLineItemChange?.(item.id, { image: undefined })} />
        </CardContent>
      </Card>
    </div>
  )
}
