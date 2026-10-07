import { documentFacts } from '../../../document/pageLayout'
import { LocalImage } from '../../document-page/LocalImage'
import type { RegionProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// Letterhead with the sender's details, then the reference line: document title, number and dates.
export function CorrespondenceHeader({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <header className="corr-header">
      <div className="corr-letterhead">
        <div>
          {model.company.logo !== null && <LocalImage src={model.company.logo} alt="" className="document-logo" />}
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
        <div>
          {DOC_LABELS.issued} {facts.issued}
        </div>
        {facts.date && (
          <div>
            {facts.date.label} {facts.date.value}
          </div>
        )}
      </div>
    </header>
  )
}
