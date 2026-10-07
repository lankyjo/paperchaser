import { documentFacts } from '../../../document/pageLayout'
import type { RegionProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// Closing line and the sender's contact details in three columns under a hairline.
export function CorrespondenceFooter({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <footer className="corr-footer">
      <p className="corr-closing">{DOC_LABELS.withThanks}</p>
      <div className="corr-contact corr-mono">
        <div>
          <b>{DOC_LABELS.from}</b>
          {facts.company}
        </div>
        {facts.companyLines.length > 0 && (
          <div>
            <b>{DOC_LABELS.contact}</b>
            {facts.companyLines.join(', ')}
          </div>
        )}
        {facts.number !== '' && (
          <div>
            <b>{DOC_LABELS.reference}</b>
            {facts.number}
          </div>
        )}
      </div>
    </footer>
  )
}
