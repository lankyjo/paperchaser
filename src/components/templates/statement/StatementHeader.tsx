import { DOC_TYPES } from '../../../document/docTypes'
import { formatMoney } from '../../../document/money'
import { documentFacts } from '../../../document/pageLayout'
import { LocalImage } from '../../document-page/LocalImage'
import type { RegionProps } from '../templateLayouts'

// Side column (sender, amount, dates, address) beside an oversized title with the number.
export function StatementHeader({ model, totals }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="statement-header">
      <aside className="statement-side">
        <div className="statement-brand">
          {model.company.logo !== null && <LocalImage src={model.company.logo} alt="" className="document-logo" />}
          <span>{facts.company}</span>
        </div>
        {DOC_TYPES[model.type].money && (
          <div>
            <div className="statement-label">Amount</div>
            <div className="statement-amount">{formatMoney(totals.grandTotalMinor, model.currency, model.locale)}</div>
          </div>
        )}
        <div>
          <div className="statement-row">
            <span>Issued</span>
            <span>{facts.issued}</span>
          </div>
          {facts.date && (
            <div className="statement-row">
              <span>{facts.date.label}</span>
              <span>{facts.date.value}</span>
            </div>
          )}
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
        {facts.number !== '' && <div className="statement-number">No. {facts.number}</div>}
      </div>
    </header>
  )
}
