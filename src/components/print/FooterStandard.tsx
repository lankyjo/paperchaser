import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

/**
 * FooterStandard — hairline rule + 2-line blurb preset (BRND-05): a top
 * border in the template border token, then the payment + thanks lines in the
 * muted token color. Default for Freelancer / Creative.
 *
 * Copy is the D-05 English payment/thanks lines (plan 04).
 * colors come from tokens — no hardcoded hexes. All text renders as React
 * text nodes (T-03-04).
 */
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
