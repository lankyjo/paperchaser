import { documentFacts } from '../../../document/pageLayout'
import type { PageMarkProps } from '../templateLayouts'

// Small centered title and page count at the foot of every page.
export function AtelierPageMark({ model, page, pages }: PageMarkProps) {
  return (
    <div className="atelier-page-mark">
      {documentFacts(model).title} · {page} / {pages}
    </div>
  )
}
