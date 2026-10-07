import { documentFacts } from '../../../document/pageLayout'
import { CompanyLogo } from '../CompanyLogo'
import type { RegionProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// Titles longer than this drop to a smaller size so they stay on two lines.
const LONG_TITLE = 10

// Sender row, a huge title with a red full stop, then a ruled strip of number, dates and amount.
export function SwissHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  const strip = [
    [DOC_LABELS.number, facts.number],
    ...facts.dates.map((date) => [date.label, date.value]),
    ...(facts.amount !== null ? [[DOC_LABELS.amount, facts.amount]] : []),
  ].filter(([, value]) => value !== '')
  return (
    <header className="swiss-header">
      <div className="swiss-brand">
        <div>
          <CompanyLogo model={model} />
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
