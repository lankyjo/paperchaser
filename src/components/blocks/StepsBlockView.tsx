import type { Block } from '../../document/blocks'
import { PlainTextCell } from '../edit/PlainTextCell'

type StepsBlock = Extract<Block, { type: 'steps' }>
type Item = StepsBlock['items'][number]

// Numbered steps with a title and description each, e.g. "What happens next".
export function StepsBlockView({ block, onChange }: { block: StepsBlock; onChange?: (next: Block) => void }) {
  const setItem = (idx: number, item: Item) => onChange?.({ ...block, items: block.items.map((it, i) => (i === idx ? item : it)) })
  const editable = onChange !== undefined

  return (
    <div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {block.items.map((item, idx) => (
          <li key={idx} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', padding: '6px 0' }}>
            <span style={{ fontFamily: 'var(--tpl-font-label)', color: 'var(--tpl-primary)', fontSize: '10px' }}>{String(idx + 1).padStart(2, '0')}</span>
            <div>
              <div style={{ fontWeight: 600 }}><PlainTextCell value={item.title} placeholder="Step title" editable={editable} onCommit={(title) => setItem(idx, { ...item, title })} /></div>
              <div><PlainTextCell value={item.description} placeholder="What happens in this step" editable={editable} onCommit={(description) => setItem(idx, { ...item, description })} /></div>
            </div>
          </li>
        ))}
      </ol>
      {onChange && (
        <button type="button" className="mt-1 text-[11px] text-muted-foreground underline print:hidden" onClick={() => onChange({ ...block, items: [...block.items, { title: '', description: '' }] })}>
          Add step
        </button>
      )}
    </div>
  )
}
