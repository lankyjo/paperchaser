import type { DocumentModel } from '../../document/types'
import { LineItemRow } from './LineItemRow'
import { DOC_LABELS } from '../../strings/documentLabels'

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
          <th>{DOC_LABELS.item}</th>
          <th>{DOC_LABELS.description}</th>
          <th className="num">{DOC_LABELS.quantity}</th>
          <th className="num">{DOC_LABELS.unitPrice}</th>
          <th className="num">{DOC_LABELS.amount}</th>
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
