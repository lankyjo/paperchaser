import type { TemplateTokens } from '../tokens'

// Freelancer template tokens: warm orange accent, 6px rounded panels, no closed grids.
export const freelancerTokens: TemplateTokens = {
  palette: {
    ink: '#292524',
    primary: '#ea580c', // warm orange default
    accent: null, // accent falls back to orange
    border: '#e7e5e4',
    fill: '#fafaf9',
    muted: '#78716c', // warm gray
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '24px', // document base; no serif
    titleWeight: 600,
    labelFontId: 'geist',
    labelLetterspacing: '0em',
  },
  borders: {
    rowRule: '#e7e5e4', // 1px hairlines
  },
  spacing: {
    sectionGap: '10mm', // airy sections
    pagePadding: '15mm', // harness geometry contract (all templates)
    bandWidth: '0px',
    radius: '6px', // rounded panels
  },
  header: {
    style: 'standard',
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'standard', // accent top rule, friendly thanks line
  },
  table: {
    headerText: '#ea580c', // accent 600 text on warm #fff7ed fill
  },
  totals: {
    rule: '#ea580c', // grand total accent color
  },
}
