import type { ResolvedTokens } from '../../document/tokens'
import { DOC_TITLES, FONT_STACKS } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { LocalImage } from '../document-page/LocalImage'
import { formatDocDate } from '../../document/formatDocDate'

// Header preset: company block left, title and meta right; also used for the offset layout.
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
          <LocalImage src={model.company.logo} alt="" className="document-logo" style={{ width: 48, height: 48 }} />
        )}
        <h1 style={{ fontSize: '20px', margin: '4px 0', fontFamily: FONT_STACKS[tokens.fonts.headingFontId] }}>
          {getPlainText(model.company.name)}
        </h1>
        {model.company.address.map((line) => (
          <div key={getPlainText(line)}>{getPlainText(line)}</div>
        ))}
        <div>{getPlainText(model.company.email)}</div>
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
          {getPlainText(model.number)} · {formatDocDate(model.issueDate, model.locale)}
        </div>
      </div>
    </header>
  )
}
