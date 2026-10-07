import type { CSSProperties } from 'react'
import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { NumericCell } from '../edit/NumericCell'
import { RichTextCell } from '../edit/RichTextCell'
import { formatMinor } from './formatMinor'

type LineItem = DocumentModel['lineItems'][number]

// One line-item table row; cells become editors when onPatch is given.
export function LineItemRow({
  item,
  currency,
  netMinor,
  rowStyle,
  onPatch,
}: {
  item: LineItem
  currency: DocumentModel['currency']
  netMinor: number
  rowStyle: CSSProperties
  onPatch?: (patch: Partial<LineItem>) => void
}) {
  return (
    <tr style={rowStyle}>
      <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
        {onPatch ? (
          <RichTextCell
            key={`title-${item.id}-${JSON.stringify(item.title)}`}
            text={item.title}
            onCommit={(title) => onPatch({ title })}
          />
        ) : (
          getPlainText(item.title)
        )}
        {item.image ? (
          <img
            src={item.image}
            alt=""
            style={{ marginTop: 4, maxHeight: 60, maxWidth: 80, objectFit: 'contain', display: 'block' }}
          />
        ) : null}
      </td>
      <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
        {onPatch ? (
          <RichTextCell
            key={`desc-${item.id}-${JSON.stringify(item.description)}`}
            text={item.description}
            onCommit={(description) => onPatch({ description })}
          />
        ) : (
          getPlainText(item.description)
        )}
      </td>
      <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>
        {onPatch ? (
          <NumericCell quantity={item.quantity} currency={currency} onCommit={(quantity) => onPatch({ quantity })} />
        ) : (
          item.quantity
        )}
      </td>
      <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>
        {onPatch ? (
          <NumericCell valueMinor={item.unitPriceMinor} currency={currency} onCommit={(unitPriceMinor) => onPatch({ unitPriceMinor })} />
        ) : (
          formatMinor(item.unitPriceMinor)
        )}
      </td>
      <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>
        {formatMinor(netMinor)}
      </td>
    </tr>
  )
}
