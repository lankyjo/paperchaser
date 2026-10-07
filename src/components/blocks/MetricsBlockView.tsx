import type { Block } from '../../document/blocks'
import { getPlainText } from '../../document/richtext'
import { RichTextCell } from '../edit/RichTextCell'
import { labelStyle } from './blockStyles'

type MetricsBlock = Extract<Block, { type: 'metrics' }>
type Item = MetricsBlock['items'][number]

// Key-number tiles: a big value, its label and an optional note.
export function MetricsBlockView({ block, onChange }: { block: MetricsBlock; onChange?: (next: Block) => void }) {
  const setItem = (idx: number, item: Item) => onChange?.({ ...block, items: block.items.map((it, i) => (i === idx ? item : it)) })
  const cell = (value: string, placeholder: string, commit: (text: string) => void) =>
    onChange ? <RichTextCell key={value} text={value} placeholder={placeholder} onCommit={(next) => commit(getPlainText(next))} /> : value

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {block.items.map((item, idx) => (
          <div key={idx} style={{ border: '1px solid var(--tpl-border)', borderRadius: 'var(--tpl-radius)', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--tpl-font-heading)', fontSize: '20px', fontWeight: 600 }}>{cell(item.value, '0', (value) => setItem(idx, { ...item, value }))}</div>
            <div style={labelStyle}>
              {cell(item.label, 'Label', (label) => setItem(idx, { ...item, label }))}
            </div>
            <div style={{ fontSize: '10px' }}>{cell(item.note, 'Note', (note) => setItem(idx, { ...item, note }))}</div>
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
