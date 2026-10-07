import type { Block } from '../../document/blocks'
import { PlainTextCell } from '../edit/PlainTextCell'
import { labelStyle } from './blockStyles'

type KeyValueBlock = Extract<Block, { type: 'keyValue' }>
type Row = KeyValueBlock['rows'][number]


// A titled list of label/value rows, e.g. "Your project at a glance".
export function KeyValueBlockView({ block, onChange }: { block: KeyValueBlock; onChange?: (next: Block) => void }) {
  const setRow = (idx: number, row: Row) => onChange?.({ ...block, rows: block.rows.map((r, i) => (i === idx ? row : r)) })
  const editable = onChange !== undefined

  return (
    <section>
      {(block.title !== '' || onChange) && (
        <h3 style={{ ...labelStyle, margin: '0 0 6px' }}><PlainTextCell value={block.title} placeholder="Section title" editable={editable} onCommit={(title) => onChange?.({ ...block, title })} /></h3>
      )}
      <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', margin: 0 }}>
        {block.rows.map((row, idx) => (
          <div key={idx} style={{ display: 'contents' }}>
            <dt style={{ ...labelStyle, padding: '6px 0', borderBottom: '1px solid var(--tpl-border)' }}>
              <PlainTextCell value={row.label} placeholder="Label" editable={editable} onCommit={(label) => setRow(idx, { ...row, label })} />
            </dt>
            <dd style={{ margin: 0, padding: '6px 0', borderBottom: '1px solid var(--tpl-border)' }}>
              <PlainTextCell value={row.value} placeholder="Value" editable={editable} onCommit={(value) => setRow(idx, { ...row, value })} />
            </dd>
          </div>
        ))}
      </dl>
      {onChange && (
        <button type="button" className="mt-1 text-[11px] text-muted-foreground underline print:hidden" onClick={() => onChange({ ...block, rows: [...block.rows, { label: '', value: '' }] })}>
          Add row
        </button>
      )}
    </section>
  )
}
