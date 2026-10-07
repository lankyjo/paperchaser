import { documentFacts } from '../../../document/pageLayout'
import type { RegionProps } from '../templateLayouts'

// Closing line and the sender's contact details in three columns under a hairline.
export function CorrespondenceFooter({ model }: RegionProps) {
  const facts = documentFacts(model)
  return (
    <footer className="corr-footer">
      <p className="corr-closing">With thanks,</p>
      <div className="corr-contact corr-mono">
        <div>
          <b>From</b>
          {facts.company}
        </div>
        {facts.companyLines.length > 0 && (
          <div>
            <b>Contact</b>
            {facts.companyLines.join(', ')}
          </div>
        )}
        {facts.number !== '' && (
          <div>
            <b>Reference</b>
            {facts.number}
          </div>
        )}
      </div>
    </footer>
  )
}
