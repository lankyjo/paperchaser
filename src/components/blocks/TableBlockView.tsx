import type { Block } from '../../document/blocks'
import { PlainTextCell } from '../edit/PlainTextCell'
import { labelStyle } from './blockStyles'

type TableBlock = Extract<Block, { type: 'table' }>

const cellStyle = { padding: '6px 8px 6px 0', borderBottom: '1px solid var(--tpl-border)', textAlign: 'left', verticalAlign: 'top' } as const

// A display table such as a delivery file list; headers and cells are plain text.
export function TableBlockView({ block, onChange, range }: { block: TableBlock; onChange?: (next: Block) => void; range?: [number, number] }) {
  const editable = onChange !== undefined
  const setColumn = (c: number, text: string) => onChange?.({ ...block, columns: block.columns.map((v, i) => (i === c ? text : v)) })
  const setCell = (r: number, c: number, text: string) =>
    onChange?.({ ...block, rows: block.rows.map((row, i) => (i === r ? row.map((v, j) => (j === c ? text : v)) : row)) })

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {block.columns.map((col, c) => (
              <th key={c} style={{ ...cellStyle, ...labelStyle }}>
                <PlainTextCell value={col} placeholder="—" editable={editable} onCommit={(text) => setColumn(c, text)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} data-unit>
              {row.map((value, c) => (
                <td key={c} style={cellStyle}>
                  <PlainTextCell value={value} placeholder="—" editable={editable} onCommit={(text) => setCell(r, c, text)} />
                </td>
              ))}
            </tr>
          )).slice(...(range ?? []))}
        </tbody>
      </table>
      {onChange && (
        <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground print:hidden">
          <button type="button" className="underline" onClick={() => onChange({ ...block, rows: [...block.rows, block.columns.map(() => '')] })}>
            Add row
          </button>
          <button type="button" className="underline" onClick={() => onChange({ ...block, columns: [...block.columns, ''], rows: block.rows.map((row) => [...row, '']) })}>
            Add column
          </button>
          {block.rows.length > 1 && (
            <button type="button" className="underline" onClick={() => onChange({ ...block, rows: block.rows.slice(0, -1) })}>
              Remove last row
            </button>
          )}
        </div>
      )}
    </div>
  )
}
