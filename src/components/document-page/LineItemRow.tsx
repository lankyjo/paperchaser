import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { NumericCell } from '../edit/NumericCell'
import { RichTextCell } from '../edit/RichTextCell'
import { LocalImage } from './LocalImage'
import { formatMoney } from '../../document/money'

type LineItem = DocumentModel['lineItems'][number]

// One line-item table row; cells become editors when onPatch is given.
export function LineItemRow({
  item,
  currency,
  locale,
  netMinor,
  onPatch,
}: {
  item: LineItem
  currency: DocumentModel['currency']
  locale: string | undefined
  netMinor: number
  onPatch?: (patch: Partial<LineItem>) => void
}) {
  return (
    <tr data-unit>
      <td className="doc-items-title">
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
          <LocalImage
            src={item.image}
            alt=""
            className="doc-items-image"
          />
        ) : null}
      </td>
      <td className="doc-items-description">
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
      <td className="num doc-items-quantity">
        {onPatch ? (
          <NumericCell quantity={item.quantity} currency={currency} locale={locale} onCommit={(quantity) => onPatch({ quantity })} />
        ) : (
          item.quantity
        )}
      </td>
      <td className="num doc-items-price">
        {onPatch ? (
          <NumericCell valueMinor={item.unitPriceMinor} currency={currency} locale={locale} onCommit={(unitPriceMinor) => onPatch({ unitPriceMinor })} />
        ) : (
          formatMoney(item.unitPriceMinor, currency, locale)
        )}
      </td>
      <td className="num doc-items-amount">
        {formatMoney(netMinor, currency, locale)}
      </td>
    </tr>
  )
}
