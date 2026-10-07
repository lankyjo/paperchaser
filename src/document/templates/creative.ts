import type { TemplateTokens } from '../tokens'

// Creative template tokens: display serif, 8mm violet left band with 18mm left padding, mono uppercase labels.
export const creativeTokens: TemplateTokens = {
  palette: {
    ink: '#18181b',
    primary: '#7c3aed', // violet default
    accent: null, // accent falls back to violet
    border: '#e4e4e7', // row rules
    fill: '#f5f3ff',
    muted: '#a1a1aa', // warm gray
  },
  fonts: {
    headingFontId: 'source-serif-4', // display serif
    bodyFontId: 'geist',
    titleSize: '26px', // serif italic treatment
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
