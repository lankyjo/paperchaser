import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { DOC_LABELS } from '../../strings/documentLabels'
import { PaymentDetails } from '../document-page/PaymentDetails'

// Footer preset: hairline rule over muted payment and thanks lines.
export function FooterStandard({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <footer style={{ marginTop: 'var(--tpl-section-gap)' }}>
      <div style={{ borderTop: `1px solid ${tokens.palette.border}`, marginBottom: '4mm' }} />
      <div style={{ color: tokens.palette.muted }}>
        <PaymentDetails model={model} className="mb-2" />
        <div>{DOC_LABELS.footerThanks}</div>
      </div>
    </footer>
  )
}
