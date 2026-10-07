import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { DOC_LABELS } from '../../strings/documentLabels'

// Footer preset: hairline rule over muted payment and thanks lines.
export function FooterStandard({ tokens, model: _model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)' }}>
      <div style={{ borderTop: `1px solid ${tokens.palette.border}`, marginBottom: '4mm' }} />
      <div style={{ color: tokens.palette.muted }}>
        <div>{DOC_LABELS.footerPayment}</div>
        <div>{DOC_LABELS.footerThanks}</div>
      </div>
    </footer>
  )
}
