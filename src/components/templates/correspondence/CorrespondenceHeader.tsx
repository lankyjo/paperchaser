import { documentFacts } from '../../../document/pageLayout'
import { CompanyLogo } from '../CompanyLogo'
import type { RegionProps } from '../templateLayouts'

// Letterhead with the sender's details, then the reference line: document title, number and dates.
export function CorrespondenceHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="corr-header">
      <div className="corr-letterhead">
        <div>
          <CompanyLogo model={model} />
          <h2>{facts.company}</h2>
        </div>
        <div className="corr-mono">
          {facts.companyLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
      <div className="corr-reference corr-mono">
        <div>
          {facts.title}
          {facts.number !== '' && ` Nº ${facts.number}`}
        </div>
        {facts.dates.map((date) => (
          <div key={date.label}>
            {date.label} {date.value}
          </div>
        ))}
      </div>
    </header>
  )
}
