import { getPlainText } from '../../../document/richtext'
import type { RegionProps } from '../templateLayouts'

// A large thank-you with the sender's email for questions.
export function StatementFooter({ model }: RegionProps) {
  return (
    <footer className="statement-footer">
      <span className="statement-thanks">Thank you.</span>
      <span>Questions? {getPlainText(model.company.email)}</span>
    </footer>
  )
}
