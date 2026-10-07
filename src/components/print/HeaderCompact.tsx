import type { ResolvedTokens } from '../../document/tokens'
import { DOC_TITLES, FONT_STACKS } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { LocalImage } from '../document-page/LocalImage'
import { documentFacts } from '../../document/pageLayout'

// Header preset: single line with logo and name left, title, number and date right.
export function HeaderCompact({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  const facts = documentFacts(model)
  return (
    <header style={{ marginBottom: 'var(--tpl-section-gap)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12mm' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
          {model.company.logo !== null && (
            <LocalImage src={model.company.logo} alt="" className="document-logo" style={{ width: 24, height: 24 }} />
          )}
          <span style={{ fontSize: '16px', fontWeight: 600, fontFamily: FONT_STACKS[tokens.fonts.headingFontId] }}>
            {getPlainText(model.company.name)}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 'var(--tpl-title-size)', fontWeight: 'var(--tpl-title-weight)', textTransform: 'uppercase' }}>
            {DOC_TITLES[model.type]}
          </span>
          <span style={{ marginLeft: '8px' }}>
            {facts.number} · {facts.issued}
          </span>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${tokens.palette.border}`, marginTop: '4mm' }} />
    </header>
  )
}
