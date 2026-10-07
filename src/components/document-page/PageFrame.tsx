import type { CSSProperties, ReactNode } from 'react'
import { PAGE_SIZES } from '../../document/tokens'
import type { PageSize } from '../../document/types'

// Page block at the page size's mm dimensions with a fixed 15mm padding; @page margin stays 0 so the margin is not doubled.
function pageStyleFor(pageSize: PageSize): CSSProperties {
  const g = PAGE_SIZES[pageSize]
  return {
    width: g.width,
    minHeight: g.height,
    margin: '0 auto',
    padding: '15mm',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: 'var(--tpl-ink)',
    fontFamily: 'var(--tpl-font-body)',
    fontSize: '11px',
    lineHeight: 1.5,
    position: 'relative',
  }
}

interface PageFrameProps {
  pageSize: PageSize | undefined
  cssVars: Record<string, string>
  watermark: { text: string; color: string } | null
  children: ReactNode
}

// The printable page root shared by every document kind: size, template variables and watermark.
export function PageFrame({ pageSize, cssVars, watermark, children }: PageFrameProps) {
  return (
    <div
      id="print-root"
      className={pageSize && pageSize !== 'a4' ? `page-${pageSize}` : undefined}
      style={{ ...pageStyleFor(pageSize ?? 'a4'), ...(cssVars as CSSProperties) }}
    >
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
