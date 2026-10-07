import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { DOC_LABELS } from '../../strings/documentLabels'
import { PaymentDetails } from '../document-page/PaymentDetails'

// Footer preset: one muted block of payment and thanks lines.
export function FooterMinimal({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)', color: tokens.palette.muted }}>
      <PaymentDetails model={model} className="mb-2" />
      <div>{DOC_LABELS.footerThanks}</div>
    </footer>
  )
}
