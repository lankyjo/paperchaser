import type { CSSProperties } from 'react'
import type { DocumentModel } from '../../document/types'
import { LineItemRow } from './LineItemRow'

const row: CSSProperties = { borderBottom: '1px solid var(--tpl-row-rule)' }

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
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--tpl-section-gap)' }}>
      <thead>
        <tr style={row}>
          <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
          <th style={{ textAlign: 'left', padding: '6px 0' }}>Description</th>
          <th style={{ textAlign: 'right', padding: '6px 0' }}>Qty</th>
          <th style={{ textAlign: 'right', padding: '6px 0' }}>Unit price</th>
          <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {model.lineItems.slice(from, range?.[1]).map((item, i) => (
          <LineItemRow
            key={item.id}
            item={item}
            currency={model.currency}
            locale={model.locale}
            netMinor={lineNets[from + i]}
            rowStyle={row}
            onPatch={onCommit ? (patch) => patchItem(item.id, patch) : undefined}
          />
        ))}
      </tbody>
    </table>
  )
}
