import type { CSSProperties, ReactNode } from 'react'
import { PAGE_PADDING_MM } from '../../document/pageLayout'
import { PAGE_SIZES } from '../../document/tokens'
import type { PageSize, TemplateId } from '../../document/types'

// Page block at the page size's mm dimensions with the shared page padding; @page margin stays 0 so the margin is not doubled.
function pageStyleFor(pageSize: PageSize, fixedHeight: boolean): CSSProperties {
  const g = PAGE_SIZES[pageSize]
  return {
    width: g.width,
    ...(fixedHeight ? { height: g.height, overflow: 'hidden' } : { minHeight: g.height }),
    margin: '0 auto',
    padding: `${PAGE_PADDING_MM}mm`,
    paddingLeft: 'var(--tpl-padding-left)',
    boxSizing: 'border-box',
    background: 'var(--tpl-fill)',
    color: 'var(--tpl-ink)',
    fontFamily: 'var(--tpl-font-body)',
    fontSize: 'var(--tpl-body-size)',
    lineHeight: 1.5,
    position: 'relative',
  }
}

interface PageFrameProps {
  id?: string
  templateId: TemplateId
  pageSize: PageSize
  // A printed page is exactly one sheet tall; the editor page grows with its content.
  fixedHeight?: boolean
  cssVars: Record<string, string>
  watermark: { text: string; color: string } | null
  children: ReactNode
}

// A page shared by every document kind: size, template variables and watermark.
export function PageFrame({ id, templateId, pageSize, fixedHeight = false, cssVars, watermark, children }: PageFrameProps) {
  return (
    <div id={id} className={`document-page page-${pageSize} tpl-${templateId}`} style={{ ...pageStyleFor(pageSize, fixedHeight), ...(cssVars as CSSProperties) }}>
      {watermark !== null && (
        // Inline accent color; print.css only holds a fallback color.
        <div className="watermark" aria-hidden="true" style={{ color: watermark.color }}>
          {watermark.text}
        </div>
      )}
      {children}
    </div>
  )
}
