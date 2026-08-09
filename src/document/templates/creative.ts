import type { TemplateTokens } from '../tokens'

/**
 * Creative template tokens — values VERBATIM from the 03-UI-SPEC identity
 * table (the single source of truth). Data only, no logic.
 *
 * Asymmetric display serif, 8mm violet left band, 18mm left padding offset,
 * mono uppercase labels (UI-SPEC §Template Identity 7).
 */
export const creativeTokens: TemplateTokens = {
  palette: {
    ink: '#18181b',
    primary: '#7c3aed', // violet default
    accent: null, // D-04 chain resolves to violet
    border: '#e4e4e7', // row rules
    fill: '#f5f3ff',
    muted: '#a1a1aa', // warm gray (UI-SPEC)
  },
  fonts: {
    headingFontId: 'source-serif-4', // display serif
    bodyFontId: 'geist',
    titleSize: '26px', // serif italic treatment (italic wired in plan 03)
    titleWeight: 600,
    labelFontId: 'geist-mono', // mono uppercase labels 9px
    labelLetterspacing: '0em',
  },
  borders: {
    rowRule: '#e4e4e7', // minimal rules, no closed grids
  },
  spacing: {
    sectionGap: '10mm',
    pagePadding: '15mm', // harness geometry contract (all templates)
    pagePaddingLeft: '18mm', // band offset — content sits right of the 8mm left band
    bandWidth: '8mm', // primary vertical left band
    radius: '6px', // totals panel rounded 6px
  },
  header: {
    style: 'standard-offset', // company chip + display serif italic title
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'standard', // accent segment bar, serif italic thanks line
  },
  table: {
    headerText: '#a1a1aa', // warm gray mono uppercase labels
  },
  totals: {
    rule: '#7c3aed', // grand total accent 700
  },
}
