import { Fragment } from 'react'
import { documentFacts } from '../../../document/pageLayout'
import { CompanyLogo } from '../CompanyLogo'
import type { RegionProps } from '../templateLayouts'

// Brand and title over a gold rule, then the document's number and dates as label/value fields.
export function NoirLedgerHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="noir-header">
      <div className="noir-top">
        <div>
          <CompanyLogo model={model} className="noir-logo" />
          <div className="noir-brand">
            {facts.company}
            <span className="noir-gold">.</span>
          </div>
        </div>
        <div className="noir-title">
          <h1>{facts.title}</h1>
          {facts.number !== '' && <div className="noir-number">#{facts.number}</div>}
        </div>
      </div>
      <div className="noir-rule" />
      <dl className="noir-fields">
        {facts.dates.map((date) => (
          <Fragment key={date.label}>
            <dt>{date.label}</dt>
            <dd>{date.value}</dd>
          </Fragment>
        ))}
      </dl>
    </header>
  )
}
