import type { CSSProperties } from 'react'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../../document/types'
import { DocumentPage } from '../DocumentPage'

// Page-sized windows onto the same document, each shifted up by one page height.
export function PreviewPageStack({
  sliceCount,
  pageW,
  pageH,
  model,
  template,
  branding,
  pageSize,
}: {
  sliceCount: number
  pageW: number
  pageH: number
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize: PageSize
}) {
  // No border: the page must be pure white edge to edge to match the PDF page in pixel diffs.
  const blockStyle: CSSProperties = {
    width: pageW,
    height: pageH,
    overflow: 'hidden',
    background: '#ffffff',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {Array.from({ length: sliceCount }, (_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="mb-1.5 text-xs text-muted-foreground">
            Page {i + 1} of {sliceCount}
          </div>
          <div className="page-block" style={blockStyle}>
            <div style={{ width: pageW, transform: `translateY(${-i * pageH}px)` }}>
              <DocumentPage model={model} template={template} branding={branding} pageSize={pageSize} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
