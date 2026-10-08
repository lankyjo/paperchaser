import { SAMPLE_CLIENT, SAMPLE_SENDER, type SampleSheet as Sheet } from '../../strings/landingSamples'
import { SheetFooter } from './SheetFooter'

// One sample document as an A4 sheet: title and number, parties, the body and the sender's footer.
export function SampleSheet({ sheet, className = '' }: { sheet: Sheet; className?: string }) {
  return (
    <div className={`lp-sheet ${className}`}>
      <div className="kind">
        <h3>{sheet.title}<span>.</span></h3>
        <small>{sheet.meta[0]}<br />{sheet.meta[1]}</small>
      </div>
      {sheet.parties && (
        <div className="parties">
          <div><em>{sheet.parties[0]}</em><b>{SAMPLE_SENDER.name}</b><br />{SAMPLE_SENDER.address}</div>
          <div><em>{sheet.parties[1]}</em><b>{SAMPLE_CLIENT.name}</b><br />{SAMPLE_CLIENT.address}</div>
        </div>
      )}
      {sheet.prose && <div className="prose">{sheet.prose.map((p) => <p key={p}>{p}</p>)}</div>}
      {sheet.metrics && (
        <div className="metrics">{sheet.metrics.map(([n, l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}</div>
      )}
      {sheet.ratings && (
        <div className="rate">
          {sheet.ratings.map(([q, n]) => (
            <div key={q}><span>{q}</span>{[1, 2, 3, 4, 5].map((k) => <i key={k} className={k === n ? 'x' : ''} />)}</div>
          ))}
        </div>
      )}
      {sheet.lines && (
        <div className="lines">
          {sheet.lines.map(([t, note, v]) => (
            <div key={t}><span>{t}{note && <small>{note}</small>}</span><span>{v}</span></div>
          ))}
        </div>
      )}
      {sheet.total && <div className="sum"><span>{sheet.total[0]}</span><span>{sheet.total[1]}</span></div>}
      {sheet.question && <p className="prose muted">{sheet.question}</p>}
      {sheet.paid && <span className="stampx">PAID</span>}
      <SheetFooter sheet={sheet} />
    </div>
  )
}
