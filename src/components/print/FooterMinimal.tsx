import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

// Footer preset: one muted block of payment and thanks lines.
export function FooterMinimal({ tokens, model: _model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)', color: tokens.palette.muted }}>
      <div>Please transfer within 14 days to the bank account stated on the invoice.</div>
      <div>Thank you for your business.</div>
    </footer>
  )
}
