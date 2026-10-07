import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

// Footer preset: hairline rule over muted payment and thanks lines.
export function FooterStandard({ tokens, model: _model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)' }}>
      <div style={{ borderTop: `1px solid ${tokens.palette.border}`, marginBottom: '4mm' }} />
      <div style={{ color: tokens.palette.muted }}>
        <div>Please transfer within 14 days to the bank account stated on the invoice.</div>
        <div>Thank you for your business.</div>
      </div>
    </footer>
  )
}
