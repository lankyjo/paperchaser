import type { ResolvedTokens } from '../../document/tokens'
import { DOC_TITLES, FONT_STACKS } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

/**
 * HeaderBanner — the full-width primary-color band header preset (BRND-05):
 * white content, company name left, title right. Default for Modern / Agency.
 *
 * The band background is the resolved primary token (branding override or
 * template default — D-02); with no primary (Blank-style tokens) it falls
 * back to ink. Band padding, white text, and the 90%-opacity meta line are the
 * fixed banner treatment from UI-SPEC §Branding Controls — the white text is
 * the CSS keyword (a design constant, not a template identity value), never a
 * hex literal.
 *
 * Style-only: no hardcoded hexes/fonts beyond the fixed white-on-band
 * contract, no per-template branching in the component, all content renders
 * as React text nodes (T-03-04).
 */
export function HeaderBanner({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
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
          <img src={model.company.logo} alt="" className="document-logo" style={{ width: 40, height: 40 }} />
        )}
        <span style={{ fontSize: '20px', fontWeight: 600, fontFamily: FONT_STACKS[tokens.fonts.headingFontId] }}>
          {model.company.name}
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
          {model.number} · {model.issueDate}
        </div>
      </div>
    </header>
  )
}
