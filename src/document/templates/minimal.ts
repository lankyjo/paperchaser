import type { TemplateTokens } from '../tokens'

// Minimal template tokens: hairline rules, gray letterspaced labels, no decoration.
export const minimalTokens: TemplateTokens = {
  palette: {
    ink: '#111827',
    primary: null, // Minimal defines no brand primary
    accent: null, // Minimal defines no brand accent (resolved via fallback chain)
    border: '#e5e7eb',
    fill: '#ffffff',
    muted: '#6b7280', // secondary gray — parity-critical footer color
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '18px',
    titleWeight: 600,
    labelFontId: 'geist', // no mono labels
    labelLetterspacing: '0.08em', // "INVOICE" 10px 600 letterspaced gray label
  },
  borders: {
    rowRule: '#e5e7eb', // 1px hairline row rules
  },
  spacing: {
    sectionGap: '12mm', // generous sections
    pagePadding: '15mm', // harness geometry contract (all templates)
    bandWidth: '0px', // no decoration band
    radius: '0px', // no rounded panels
  },
  header: {
    style: 'standard',
    titleLabel: 'INVOICE', // 10px 600 letterspaced gray small-caps label
  },
  footer: {
    style: 'minimal', // hairline rule + one gray line
  },
  table: {
    headerText: '#6b7280', // gray header text
  },
  totals: {
    rule: '#e5e7eb', // thin top rule above grand total
  },
}
