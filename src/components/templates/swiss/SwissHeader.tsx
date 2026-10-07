import { DOC_TYPES } from '../../../document/docTypes'
import { formatMoney } from '../../../document/money'
import { documentFacts } from '../../../document/pageLayout'
import { LocalImage } from '../../document-page/LocalImage'
import type { RegionProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// Titles longer than this drop to a smaller size so they stay on two lines.
const LONG_TITLE = 10

// Sender row, a huge title with a red full stop, then a ruled strip of number, dates and amount.
export function SwissHeader({ model, totals }: RegionProps) {
  const facts = documentFacts(model)
  const strip = [
    [DOC_LABELS.number, facts.number],
    [DOC_LABELS.issued, facts.issued],
    ...(facts.date ? [[facts.date.label, facts.date.value]] : []),
    ...(DOC_TYPES[model.type].money ? [[DOC_LABELS.amount, formatMoney(totals.grandTotalMinor, model.currency, model.locale)]] : []),
  ].filter(([, value]) => value !== '')
  return (
    <header className="swiss-header">
      <div className="swiss-brand">
        <div>
          {model.company.logo !== null && <LocalImage src={model.company.logo} alt="" className="document-logo" />}
          <h2>{facts.company}</h2>
        </div>
        <div className="swiss-address">
          {facts.companyLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
      <h1 className={facts.title.length > LONG_TITLE ? 'swiss-title swiss-title-long' : 'swiss-title'}>
        {facts.title}
        <span className="swiss-red">.</span>
      </h1>
      <dl className="swiss-strip">
        {strip.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  )
}
