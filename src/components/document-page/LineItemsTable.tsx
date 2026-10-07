import type { DocumentModel } from '../../document/types'
import { LineItemRow } from './LineItemRow'

// Line-item table; editable rows commit a new model with the patched item.
export function LineItemsTable({
  model,
  lineNets,
  onCommit,
  range,
}: {
  model: DocumentModel
  lineNets: number[]
  onCommit?: (next: DocumentModel) => void
  range?: [number, number]
}) {
  const from = range?.[0] ?? 0
  const patchItem = (id: string, patch: Partial<DocumentModel['lineItems'][number]>) =>
    onCommit?.({ ...model, lineItems: model.lineItems.map((li) => (li.id === id ? { ...li, ...patch } : li)) })

  return (
    <table className="doc-items">
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th className="num">Qty</th>
          <th className="num">Unit price</th>
          <th className="num">Amount</th>
        </tr>
      </thead>
      <tbody style={{ counterReset: `line-item ${from}` }}>
        {model.lineItems.slice(from, range?.[1]).map((item, i) => (
          <LineItemRow
            key={item.id}
            item={item}
            currency={model.currency}
            locale={model.locale}
            netMinor={lineNets[from + i]}
            onPatch={onCommit ? (patch) => patchItem(item.id, patch) : undefined}
          />
        ))}
      </tbody>
    </table>
  )
}
