import type { TemplateTokens } from '../tokens'

// Blank template tokens: zero decoration, system sans, table grid only, compact header and minimal footer.
export const blankTokens: TemplateTokens = {
  palette: {
    ink: '#000000',
    primary: null, // zero decoration — no brand color
    accent: null, // "no accent"
    border: '#d1d5db',
    fill: '#ffffff',
    muted: '#6b7280', // neutral gray — footer text stays minimal
  },
  fonts: {
    headingFontId: 'system', // "Helvetica Neue", Arial
    bodyFontId: 'system',
    titleSize: '24px', // document base; Blank has no size override
    titleWeight: 700, // title 700 per identity
    labelFontId: 'system',
    labelLetterspacing: '0em', // no label styling
  },
  borders: {
    rowRule: '#d1d5db', // 1px table grid only
  },
  spacing: {
    sectionGap: '8mm', // compact sections
    pagePadding: '15mm', // harness geometry contract (all templates)
    bandWidth: '0px', // no band
    radius: '0px', // no rounded panels
  },
  header: {
    style: 'compact', // Blank defaults Compact header
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'minimal', // none — blank space
  },
  table: {
    headerText: '#000000', // plain ink, no styling
  },
  totals: {
    rule: 'transparent', // plain rows, no grand-total rule
  },
}
