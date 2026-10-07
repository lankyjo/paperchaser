import { documentFacts } from '../../../document/pageLayout'
import { LocalImage } from '../../document-page/LocalImage'
import type { RegionProps } from '../templateLayouts'

// Centered mark over a hairline, letterspaced title with its number, then the sender beside the dates.
export function AtelierHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="atelier-header">
      <div className="atelier-mark">
        {model.company.logo !== null ? <LocalImage src={model.company.logo} alt="" className="document-logo" /> : <span>{facts.company.charAt(0)}</span>}
      </div>
      <div className="atelier-rule" />
      <div className="atelier-head">
        <h1>{facts.title}</h1>
        {facts.number !== '' && <span>{facts.number}</span>}
      </div>
      <div className="atelier-from">
        <div>
          <div className="atelier-label">From</div>
          <div className="atelier-name">{facts.company}</div>
          {facts.companyLines.map((line) => (
            <div key={line} className="atelier-soft">
              {line}
            </div>
          ))}
        </div>
        <dl className="atelier-dates">
          <dt>Issued</dt>
          <dd>{facts.issued}</dd>
          {facts.date && (
            <>
              <dt>{facts.date.label}</dt>
              <dd>{facts.date.value}</dd>
            </>
          )}
        </dl>
      </div>
    </header>
  )
}
