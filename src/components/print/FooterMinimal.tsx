import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

/**
 * FooterMinimal — the smallest footer preset (BRND-05): one muted gray line
 * (thanks/payment blurb). Default for Blank / Minimal / Modern.
 *
 * The copy stays the pre-preset German payment/thanks lines — D-05 English
 * migration (plan 04) owns copy changes; the parity golden pins the minimal
 * footer byte-identically, and `tokens.palette.muted` resolves to the exact
 * baseline color for Minimal so the rendering is unchanged.
 *
 * Style-only: color comes from the muted token, never a hardcoded hex. All
 * text renders as React text nodes (T-03-04).
 */
export function FooterMinimal({ tokens, model: _model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)', color: tokens.palette.muted }}>
      <div>Überweisung innerhalb 14 Tage auf das in der Rechnung genannte Konto.</div>
      <div>Vielen Dank für Ihren Auftrag.</div>
    </footer>
  )
}
