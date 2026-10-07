import type { TemplateTokens } from '../tokens'

// Corporate template tokens: formal serif headings, navy, closed table grid, double rules.
export const corporateTokens: TemplateTokens = {
  palette: {
    ink: '#1f2937',
    primary: '#1e3a5f', // default navy
    accent: null, // accent falls back to navy
    border: '#d1d5db',
    fill: '#ffffff',
    muted: '#4b5563', // gray
  },
  fonts: {
    headingFontId: 'source-serif-4', // serif headings 600
    bodyFontId: 'geist',
    titleSize: '24px', // document base
    titleWeight: 600,
    labelFontId: 'geist',
    labelLetterspacing: '0em',
  },
  borders: {
    rowRule: '#d1d5db', // closed grid 1px
  },
  spacing: {
    sectionGap: '10mm', // formal sections
    pagePadding: '15mm', // harness geometry contract (all templates)
    bandWidth: '0px',
    radius: '0px',
  },
  header: {
    style: 'standard',
    titleLabel: 'INVOICE', // serif small-caps treatment
  },
  footer: {
    style: 'detailed', // double rule, bank/payment label-value grid
  },
  table: {
    headerText: '#4b5563', // gray on #f3f4f6 th fill
  },
  totals: {
    rule: '#1e3a5f', // grand total 2px top rule
  },
}
