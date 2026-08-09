import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

/**
 * FooterDetailed — double rule + small-print grid preset (BRND-05): a 2px
 * rule over a 1px rule (both in the template border token), then the payment
 * + thanks lines and the company contact in the muted token, set as small
 * print. Default for Corporate / Agency.
 *
 * The model has no bank-details fields yet (Phase 5 company profile) — the
 * grid renders only the existing footer copy and real model data
 * (company.email); a bank/IBAN label-value row lands with the profile.
 * Copy stays the pre-preset German lines (D-05 English migration is plan 04).
 * Colors come from tokens — no hardcoded hexes. All text renders as React
 * text nodes (T-03-04).
 */
export function FooterDetailed({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)' }}>
      <div style={{ borderTop: `2px solid ${tokens.palette.border}`, marginBottom: '1px' }} />
      <div style={{ borderTop: `1px solid ${tokens.palette.border}`, marginBottom: '4mm' }} />
      <div style={{ color: tokens.palette.muted, fontSize: '10px', lineHeight: 1.6 }}>
        <div>Überweisung innerhalb 14 Tage auf das in der Rechnung genannte Konto.</div>
        <div>Vielen Dank für Ihren Auftrag.</div>
        <div>{model.company.email}</div>
      </div>
    </footer>
  )
}
