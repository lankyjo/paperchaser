import type { ResolvedTokens } from '../../document/tokens'
import { DOC_TITLES, FONT_STACKS } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'

/**
 * HeaderCompact — the single-line header preset (BRND-05): logo + company
 * name left, title + number + date right, hairline rule below. Default for
 * Blank.
 *
 * Style-only: colors/fonts come from the resolved tokens; the hairline rule
 * uses the template border token. No hardcoded hexes/fonts, no per-template
 * branching in the component, all content renders as React text nodes
 * (T-03-04).
 */
export function HeaderCompact({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <header style={{ marginBottom: 'var(--tpl-section-gap)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12mm' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
          {model.company.logo !== null && (
            <img src={model.company.logo} alt="" className="document-logo" style={{ width: 24, height: 24 }} />
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
            {getPlainText(model.number)} · {model.issueDate}
          </span>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${tokens.palette.border}`, marginTop: '4mm' }} />
    </header>
  )
}
