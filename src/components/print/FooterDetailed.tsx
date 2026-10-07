import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'

// Footer preset: double rule over small-print payment, thanks and contact lines.
export function FooterDetailed({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)' }}>
      <div style={{ borderTop: `2px solid ${tokens.palette.border}`, marginBottom: '1px' }} />
      <div style={{ borderTop: `1px solid ${tokens.palette.border}`, marginBottom: '4mm' }} />
      <div style={{ color: tokens.palette.muted, fontSize: '10px', lineHeight: 1.6 }}>
        <div>Please transfer within 14 days to the bank account stated on the invoice.</div>
        <div>Thank you for your business.</div>
        <div>{getPlainText(model.company.email)}</div>
      </div>
    </footer>
  )
}
