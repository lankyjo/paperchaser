import type { Block } from '../../document/blocks'
import { PlainTextCell } from '../edit/PlainTextCell'
import { AnswerBox } from './AnswerBox'
import { labelStyle } from './blockStyles'

type ChecklistBlock = Extract<Block, { type: 'checklist' }>
type Item = ChecklistBlock['items'][number]

// A titled list of items with printable tick boxes.
export function ChecklistBlockView({ block, onChange }: { block: ChecklistBlock; onChange?: (next: Block) => void }) {
  const setItem = (idx: number, item: Item) => onChange?.({ ...block, items: block.items.map((it, i) => (i === idx ? item : it)) })
  const editable = onChange !== undefined

  return (
    <section>
      <h3 style={{ ...labelStyle, margin: '0 0 6px' }}><PlainTextCell value={block.title} placeholder="Section title" editable={editable} onCommit={(title) => onChange?.({ ...block, title })} /></h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {block.items.map((item, idx) => (
          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
            <AnswerBox
              label={`Tick ${item.text || 'item ' + (idx + 1)}`}
              filled={item.checked === true}
              onToggle={onChange && (() => setItem(idx, { ...item, checked: !item.checked }))}
            />
            <span style={{ flex: 1 }}><PlainTextCell value={item.text} placeholder="Item" editable={editable} onCommit={(t) => setItem(idx, { ...item, text: t })} /></span>
          </li>
        ))}
      </ul>
      {onChange && (
        <button type="button" className="mt-1 text-[11px] text-muted-foreground underline print:hidden" onClick={() => onChange({ ...block, items: [...block.items, { text: '' }] })}>
          Add item
        </button>
      )}
    </section>
  )
}
