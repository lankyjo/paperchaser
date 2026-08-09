import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

/**
 * FooterMinimal — the smallest footer preset (BRND-05): one muted gray line
 * (thanks/payment blurb). Default for Blank / Minimal / Modern.
 *
 * Copy is the D-05 English payment/thanks lines (plan 04 owns copy changes);
 * `tokens.palette.muted` resolves to the exact baseline color for Minimal so
 * the rendering is unchanged apart from the translated text.
 *
 * Style-only: color comes from the muted token, never a hardcoded hex. All
 * text renders as React text nodes (T-03-04).
 */
export function FooterMinimal({ tokens, model: _model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)', color: tokens.palette.muted }}>
      <div>Please transfer within 14 days to the bank account stated on the invoice.</div>
      <div>Thank you for your business.</div>
    </footer>
  )
}
