import type { Block } from '../../document/blocks'
import { formatMoney } from '../../document/money'
import { scheduleAmounts, scheduleWarning, type ScheduleBlock } from '../../document/schedule'
import type { DocumentModel } from '../../document/types'
import { labelStyle } from './blockStyles'
import { ScheduleRowActions } from './ScheduleRowActions'

type Row = ScheduleBlock['rows'][number]

const cell = { padding: '6px 8px 6px 0', borderBottom: '1px solid var(--tpl-border)', textAlign: 'left' } as const

// How the project fee is paid: each row's share, when it is due, and (while editing) the invoice that bills it.
export function PaymentScheduleBlockView({ block, model, onChange }: { block: ScheduleBlock; model: DocumentModel; onChange?: (next: Block) => void }) {
  const amounts = scheduleAmounts(block)
  const warning = scheduleWarning(block)
  const money = (minor: number) => formatMoney(minor, model.currency, model.locale)
  const setRow = (idx: number, row: Row) => onChange?.({ ...block, rows: block.rows.map((r, i) => (i === idx ? row : r)) })
  const input = 'rounded border bg-transparent px-1 print:border-0'

  return (
    <section>
      <h3 style={{ ...labelStyle, margin: '0 0 6px' }}>Payment schedule · {money(block.totalMinor)}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {block.rows.map((row, idx) => (
            <tr key={row.id}>
              <td style={cell}>
                {onChange ? <input aria-label="Payment label" className={input} value={row.label} onChange={(e) => setRow(idx, { ...row, label: e.target.value })} /> : row.label}
              </td>
              <td style={cell}>
                {onChange ? (
                  <input aria-label="Percent" type="number" min={0} max={100} className={`${input} w-16`} value={row.percentMinor / 100} onChange={(e) => setRow(idx, { ...row, percentMinor: Math.round((Number(e.target.value) || 0) * 100) })} />
                ) : (
                  `${row.percentMinor / 100}%`
                )}
              </td>
              <td style={cell}>{money(amounts[idx])}</td>
              <td style={cell}>
                {onChange ? <input aria-label="Due" className={input} value={row.due} onChange={(e) => setRow(idx, { ...row, due: e.target.value })} /> : row.due}
              </td>
              <td style={cell}>
                <ScheduleRowActions rowId={row.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {warning && <p role="alert" className="text-[11px] text-destructive print:hidden">{warning}</p>}
      {onChange && (
        <button
          type="button"
          className="mt-1 text-[11px] text-muted-foreground underline print:hidden"
          onClick={() => onChange({ ...block, rows: [...block.rows, { id: crypto.randomUUID(), label: '', percentMinor: 0, due: '' }] })}
        >
          Add payment
        </button>
      )}
    </section>
  )
}
