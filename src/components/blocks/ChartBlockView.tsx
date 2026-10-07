import type { Block } from '../../document/blocks'
import { getPlainText } from '../../document/richtext'
import { RichTextCell } from '../edit/RichTextCell'
import { labelStyle } from './blockStyles'
import { BarChart } from './BarChart'
import { CsvPaste } from './CsvPaste'

type ChartBlock = Extract<Block, { type: 'chart' }>

// A titled bar chart from numbers typed below it or pasted as CSV.
export function ChartBlockView({ block, onChange }: { block: ChartBlock; onChange?: (next: Block) => void }) {
  const setPoint = (idx: number, patch: Partial<ChartBlock['series'][number]>) =>
    onChange?.({ ...block, series: block.series.map((p, i) => (i === idx ? { ...p, ...patch } : p)) })

  return (
    <div>
      <h3 style={{ ...labelStyle, margin: '0 0 6px' }}>
        {onChange ? (
          <RichTextCell key={block.title} text={block.title} placeholder="Chart title" onCommit={(next) => onChange({ ...block, title: getPlainText(next) })} />
        ) : (
          block.title
        )}
      </h3>
      <BarChart series={block.series} />
      {onChange && (
        <div className="print:hidden">
          <div className="mt-2 grid grid-cols-[1fr_6rem] gap-1 text-xs">
            {block.series.map((point, idx) => (
              <div key={idx} className="contents">
                <input aria-label={`Bar ${idx + 1} label`} className="rounded border px-1" value={point.label} onChange={(e) => setPoint(idx, { label: e.target.value })} />
                <input aria-label={`Bar ${idx + 1} value`} className="rounded border px-1" type="number" value={point.value} onChange={(e) => setPoint(idx, { value: Number(e.target.value) || 0 })} />
              </div>
            ))}
          </div>
          <CsvPaste onApply={(rows) => onChange({ ...block, series: rows })} />
        </div>
      )}
    </div>
  )
}
