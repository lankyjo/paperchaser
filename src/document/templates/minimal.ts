import type { TemplateTokens } from '../tokens'

/**
 * Minimal template tokens — values VERBATIM from the 03-UI-SPEC identity table
 * (the single source of truth). Data only, no logic.
 */
export const minimalTokens: TemplateTokens = {
  palette: {
    ink: '#111827',
    primary: null, // Minimal defines no brand primary
    accent: null, // Minimal defines no brand accent (D-04 chain resolves it)
    border: '#e5e7eb',
    fill: '#ffffff',
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '18px',
    titleWeight: 600,
  },
  borders: {
    rowRule: '#e5e7eb', // 1px hairline row rules
  },
  spacing: {
    sectionGap: '12mm', // generous sections
    pagePadding: '15mm', // harness geometry contract (all templates)
  },
  header: {
    style: 'standard',
    titleLabel: 'INVOICE', // 10px 600 letterspaced gray small-caps label (plan 03 wires it)
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
