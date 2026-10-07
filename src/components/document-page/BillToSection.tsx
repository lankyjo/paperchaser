import type { DocumentModel } from '../../document/types'
import type { RichTextDoc } from '../../document/richtext'
import { getPlainText } from '../../document/richtext'
import { RichTextCell } from '../edit/RichTextCell'
import { OverrideNotice } from './OverrideNotice'

// Customer name and address block, as editable cells or plain text.
export function BillToSection({
  model,
  editable,
  onCommit,
}: {
  model: DocumentModel
  editable: boolean
  onCommit?: (next: DocumentModel) => void
}) {
  const commitName = (next: RichTextDoc) => onCommit?.({ ...model, customer: { ...model.customer, name: next } })
  const commitAddressLine = (idx: number, next: RichTextDoc) => {
    const addr = [...model.customer.address]
    addr[idx] = next
    onCommit?.({ ...model, customer: { ...model.customer, address: addr } })
  }

  return (
    <section className="doc-parties">
      <h3 className="doc-parties-title">Bill to</h3>
      {editable ? (
        <>
          <RichTextCell
            key={`customer-name-${JSON.stringify(model.customer.name)}`}
            text={model.customer.name}
            onCommit={commitName}
          />
          {model.customer.address.map((line, idx) => (
            <RichTextCell
              key={`customer-addr-${idx}-${JSON.stringify(line)}`}
              text={line}
              onCommit={(next) => commitAddressLine(idx, next)}
            />
          ))}
          <OverrideNotice model={model} onCommit={onCommit} />
        </>
      ) : (
        <>
          <div>{getPlainText(model.customer.name)}</div>
          {model.customer.address.map((line) => (
            <div key={getPlainText(line)}>{getPlainText(line)}</div>
          ))}
        </>
      )}
    </section>
  )
}
