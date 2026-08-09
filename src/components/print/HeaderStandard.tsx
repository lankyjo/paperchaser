import type { ResolvedTokens } from '../../document/tokens'
import { DOC_TITLES, FONT_STACKS } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'

/**
 * HeaderStandard — the split layout header preset (BRND-05): company block
 * left (logo + name + address + email), title + meta right-aligned.
 * Default for Minimal / Corporate / Freelancer (Creative's standard-offset is
 * this layout with the token-driven 18mm left offset applied at the page
 * level, so it selects this component too).
 *
 * Style-only contract: every color and font comes from the resolved tokens
 * (or the --tpl-* CSS vars those tokens emit on #print-root). No hardcoded
 * hexes or font names, no per-template branching in the component
 * (Anti-Pattern 1). All text renders as React text nodes (T-03-04:
 * escaped by default).
 *
 * The title derives from the document type (DOC_TITLES, D-05 English copy)
 * and renders in the heading font with uppercase treatment.
 */
export function HeaderStandard({ tokens, model }: { tokens: ResolvedTokens; model: DocumentModel }) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12mm',
        marginBottom: 'var(--tpl-section-gap)',
      }}
    >
      <div>
        {model.company.logo !== null && (
          <img src={model.company.logo} alt="" className="document-logo" style={{ width: 48, height: 48 }} />
        )}
        <h1 style={{ fontSize: '20px', margin: '4px 0', fontFamily: FONT_STACKS[tokens.fonts.headingFontId] }}>
          {model.company.name}
        </h1>
        {model.company.address.map((line) => (
          <div key={line}>{line}</div>
        ))}
        <div>{model.company.email}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <h2
          style={{
            fontSize: 'var(--tpl-title-size)',
            fontWeight: 'var(--tpl-title-weight)',
            fontFamily: FONT_STACKS[tokens.fonts.headingFontId],
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          {DOC_TITLES[model.type]}
        </h2>
        <div>
          {model.number} · {model.issueDate}
        </div>
      </div>
    </header>
  )
}
