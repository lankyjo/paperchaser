import { documentFacts } from '../../../document/pageLayout'
import { CompanyLogo } from '../CompanyLogo'
import type { RegionProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// Side column (sender, amount, dates, address) beside an oversized title with the number.
export function StatementHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="statement-header">
      <aside className="statement-side">
        <div className="statement-brand">
          <CompanyLogo model={model} />
          <span>{facts.company}</span>
        </div>
        {facts.amount !== null && (
          <div>
            <div className="statement-label">{DOC_LABELS.amount}</div>
            <div className="statement-amount">{facts.amount}</div>
          </div>
        )}
        <div>
          {facts.dates.map((date) => (
            <div key={date.label} className="statement-row">
              <span>{date.label}</span>
              <span>{date.value}</span>
            </div>
          ))}
        </div>
        <div className="statement-note">
          <b>{facts.company}</b>
          {facts.companyLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </aside>
      <div className="statement-head">
        <h1>{facts.title}</h1>
        {facts.number !== '' && <div className="statement-number">{DOC_LABELS.numberShort} {facts.number}</div>}
      </div>
    </header>
  )
}
