import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { DOC_LABELS } from '../../strings/documentLabels'

// Footer preset: one muted block of payment and thanks lines.
export function FooterMinimal({ tokens, model: _model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)', color: tokens.palette.muted }}>
      <div>{DOC_LABELS.footerPayment}</div>
      <div>{DOC_LABELS.footerThanks}</div>
    </footer>
  )
}
