import { documentFacts } from '../../../document/pageLayout'
import { LocalImage } from '../../document-page/LocalImage'
import type { RegionProps } from '../templateLayouts'

// Brand and title over a gold rule, then the document's number and dates as label/value fields.
export function NoirLedgerHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="noir-header">
      <div className="noir-top">
        <div>
          {model.company.logo !== null && <LocalImage src={model.company.logo} alt="" className="document-logo noir-logo" />}
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
        <dt>Issued</dt>
        <dd>{facts.issued}</dd>
        {facts.date && (
          <>
            <dt>{facts.date.label}</dt>
            <dd>{facts.date.value}</dd>
          </>
        )}
      </dl>
    </header>
  )
}
