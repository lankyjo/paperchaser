import type { TemplateTokens } from '../tokens'

// Statement: dark side column with the amount due, oversized title, lime highlight.
export const statementTokensV1: TemplateTokens = {
  palette: {
    ink: '#111111',
    primary: '#0f0f0f',
    accent: '#c8e62f',
    border: '#e8e8e8',
    fill: '#ffffff',
    muted: '#666666',
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '60px',
    titleWeight: 650,
    bodySize: '11.5px',
    labelFontId: 'geist',
    labelLetterspacing: '0.16em',
    labelColor: '#a0a0a0',
  },
  borders: {
    rowRule: '#f0f0f0',
  },
  spacing: {
    sectionGap: '9mm',
    pagePadding: '15mm',
    pagePaddingLeft: '75mm',
    radius: '6px',
  },
  header: {
    style: 'standard',
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'minimal',
  },
  table: {
    headerText: '#a0a0a0',
  },
  totals: {
    rule: '#111111',
  },
}

// Version 2: labels darkened to meet WCAG AA contrast.
export const statementTokens: TemplateTokens = { ...statementTokensV1, fonts: { ...statementTokensV1.fonts, labelColor: '#717171' } }
