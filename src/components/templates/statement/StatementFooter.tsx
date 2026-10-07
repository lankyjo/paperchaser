import { getPlainText } from '../../../document/richtext'
import type { RegionProps } from '../templateLayouts'
import { DOC_LABELS } from '../../../strings/documentLabels'

// A large thank-you with the sender's email for questions.
export function StatementFooter({ model }: RegionProps) {
  return (
    <footer className="statement-footer">
      <span className="statement-thanks">{DOC_LABELS.thankYou}</span>
      <span>{DOC_LABELS.questions} {getPlainText(model.company.email)}</span>
    </footer>
  )
}
