import { Fragment } from 'react'
import { documentFacts } from '../../../document/pageLayout'
import { CompanyLogo } from '../CompanyLogo'
import type { RegionProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// Centered mark over a hairline, letterspaced title with its number, then the sender beside the dates.
export function AtelierHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="atelier-header">
      <div className="atelier-mark">
        {model.company.logo !== null ? <CompanyLogo model={model} /> : <span>{facts.company.charAt(0)}</span>}
      </div>
      <div className="atelier-rule" />
      <div className="atelier-head">
        <h1>{facts.title}</h1>
        {facts.number !== '' && <span>{facts.number}</span>}
      </div>
      <div className="atelier-from">
        <div>
          <div className="atelier-label">{DOC_LABELS.from}</div>
          <div className="atelier-name">{facts.company}</div>
          {facts.companyLines.map((line) => (
            <div key={line} className="atelier-soft">
              {line}
            </div>
          ))}
        </div>
        <dl className="atelier-dates">
          {facts.dates.map((date) => (
            <Fragment key={date.label}>
              <dt>{date.label}</dt>
              <dd>{date.value}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </header>
  )
}
