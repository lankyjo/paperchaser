import type { Block } from '../../document/blocks'
import { PlainTextCell } from '../edit/PlainTextCell'
import { labelStyle } from './blockStyles'

type MetricsBlock = Extract<Block, { type: 'metrics' }>
type Item = MetricsBlock['items'][number]

// Key-number tiles: a big value, its label and an optional note.
export function MetricsBlockView({ block, onChange }: { block: MetricsBlock; onChange?: (next: Block) => void }) {
  const setItem = (idx: number, item: Item) => onChange?.({ ...block, items: block.items.map((it, i) => (i === idx ? item : it)) })
  const editable = onChange !== undefined

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {block.items.map((item, idx) => (
          <div key={idx} style={{ border: '1px solid var(--tpl-border)', borderRadius: 'var(--tpl-radius)', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--tpl-font-heading)', fontSize: '20px', fontWeight: 600 }}><PlainTextCell value={item.value} placeholder="0" editable={editable} onCommit={(value) => setItem(idx, { ...item, value })} /></div>
            <div style={labelStyle}>
              <PlainTextCell value={item.label} placeholder="Label" editable={editable} onCommit={(label) => setItem(idx, { ...item, label })} />
            </div>
            <div style={{ fontSize: '10px' }}><PlainTextCell value={item.note} placeholder="Note" editable={editable} onCommit={(note) => setItem(idx, { ...item, note })} /></div>
          </div>
        ))}
      </div>
      {onChange && (
        <button type="button" className="mt-1 text-[11px] text-muted-foreground underline print:hidden" onClick={() => onChange({ ...block, items: [...block.items, { label: '', value: '', note: '' }] })}>
          Add tile
        </button>
      )}
    </div>
  )
}
