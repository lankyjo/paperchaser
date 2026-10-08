import type { DocumentModel } from '../../document/types'
import { minorToPercent, minorToRaw, parseQuantity, parseToMinor, percentToMinor } from '../../document/money'
import { getPlainText } from '../../document/richtext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CommitField } from './CommitField'
import { ItemImageField } from './ItemImageField'

type LineItem = DocumentModel['lineItems'][number]

// The selected line item's fields, editable here or on the canvas, plus its image.
export function ItemProperties({
  item,
  currency,
  locale,
  onLineItemChange,
}: {
  item: LineItem
  currency: string
  locale: string | undefined
  onLineItemChange?: (id: string, patch: Partial<LineItem>) => void
}) {
  const change = (patch: Partial<LineItem>) => onLineItemChange?.(item.id, patch)
  // Invalid numbers are ignored, so the field snaps back to the stored value.
  const changeNumber = (parse: (raw: string) => number | null, toPatch: (n: number) => Partial<LineItem>) => (raw: string) => {
    const n = parse(raw)
    if (n !== null) change(toPatch(n))
  }
  const percent = (raw: string) => {
    const n = Number(raw.replace(',', '.').replace('%', '').trim())
    return raw.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null
  }
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CommitField disabled={!onLineItemChange} label="Title" value={getPlainText(item.title)} onCommit={(title) => change({ title })} />
        <CommitField disabled={!onLineItemChange} label="Description" value={getPlainText(item.description)} multiline onCommit={(description) => change({ description })} />
        <div className="grid grid-cols-2 gap-3">
          <CommitField disabled={!onLineItemChange} label="Quantity" inputMode="decimal" value={String(item.quantity)} onCommit={changeNumber(parseQuantity, (quantity) => ({ quantity }))} />
          <CommitField disabled={!onLineItemChange} label="Unit price" inputMode="decimal" value={minorToRaw(item.unitPriceMinor, currency, locale)} onCommit={changeNumber((raw) => parseToMinor(raw, currency, locale), (unitPriceMinor) => ({ unitPriceMinor }))} />
          <CommitField disabled={!onLineItemChange} label="Tax %" inputMode="decimal" value={String(minorToPercent(item.taxRateMinor))} onCommit={changeNumber(percent, (p) => ({ taxRateMinor: percentToMinor(p) }))} />
        </div>
        <ItemImageField image={item.image} onChange={(dataUrl) => change({ image: dataUrl ?? undefined })} onRemove={() => change({ image: undefined })} />
      </CardContent>
    </Card>
  )
}
