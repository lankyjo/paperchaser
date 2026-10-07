import type { Block } from '../../document/blocks'
import { getPlainText } from '../../document/richtext'
import { RichTextCell } from '../edit/RichTextCell'

type StepsBlock = Extract<Block, { type: 'steps' }>
type Item = StepsBlock['items'][number]

// Numbered steps with a title and description each, e.g. "What happens next".
export function StepsBlockView({ block, onChange }: { block: StepsBlock; onChange?: (next: Block) => void }) {
  const setItem = (idx: number, item: Item) => onChange?.({ ...block, items: block.items.map((it, i) => (i === idx ? item : it)) })
  const cell = (value: string, placeholder: string, commit: (text: string) => void) =>
    onChange ? <RichTextCell key={value} text={value} placeholder={placeholder} onCommit={(next) => commit(getPlainText(next))} /> : value

  return (
    <div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {block.items.map((item, idx) => (
          <li key={idx} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', padding: '6px 0' }}>
            <span style={{ fontFamily: 'var(--tpl-font-label)', color: 'var(--tpl-primary)', fontSize: '10px' }}>{String(idx + 1).padStart(2, '0')}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{cell(item.title, 'Step title', (title) => setItem(idx, { ...item, title }))}</div>
              <div>{cell(item.description, 'What happens in this step', (description) => setItem(idx, { ...item, description }))}</div>
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
