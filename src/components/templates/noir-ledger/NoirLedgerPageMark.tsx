import { documentFacts } from '../../../document/pageLayout'
import type { PageMarkProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// Sender and address on the left, page count on the right, at the foot of every page.
export function NoirLedgerPageMark({ model, page, pages }: PageMarkProps) {
  const facts = documentFacts(model)
  return (
    <div className="noir-page-mark">
      <span>{[facts.company, ...facts.companyLines].join(' · ')}</span>
      <span>
        {DOC_LABELS.page} {page} / {pages}
      </span>
    </div>
  )
}
