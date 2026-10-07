import type { ResolvedTokens } from '../../document/tokens'
import { DOC_TITLES, FONT_STACKS } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { LocalImage } from '../document-page/LocalImage'
import { documentFacts } from '../../document/pageLayout'

// Header preset: full-width primary-color band with company name left and title right.
export function HeaderBanner({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  const facts = documentFacts(model)
  const band = tokens.palette.primary ?? tokens.palette.ink
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12mm',
        marginBottom: 'var(--tpl-section-gap)',
        background: band,
        color: 'white',
        padding: '12px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
        {model.company.logo !== null && (
          <LocalImage src={model.company.logo} alt="" className="document-logo" style={{ width: 40, height: 40 }} />
        )}
        <span style={{ fontSize: '20px', fontWeight: 600, fontFamily: FONT_STACKS[tokens.fonts.headingFontId] }}>
          {getPlainText(model.company.name)}
        </span>
      </div>
      <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
        <div
          style={{
            fontSize: 'var(--tpl-title-size)',
            fontWeight: 'var(--tpl-title-weight)',
            fontFamily: FONT_STACKS[tokens.fonts.headingFontId],
            textTransform: 'uppercase',
            opacity: 1,
          }}
        >
          {DOC_TITLES[model.type]}
        </div>
        <div>
          {facts.number} · {facts.issued}
        </div>
      </div>
    </header>
  )
}
