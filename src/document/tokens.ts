// Template token registry: each template is a plain token object in src/document/templates/; no React, DOM or Dexie.

import { blankTokens } from './templates/blank'
import { minimalTokens } from './templates/minimal'
import { noirLedgerTokens } from './templates/noirLedger'
import { atelierTokens } from './templates/atelier'
import { statementTokens } from './templates/statement'
import { swissTokens } from './templates/swiss'
import { correspondenceTokens } from './templates/correspondence'
import { DOC_TYPE_IDS, DOC_TYPES } from './docTypes'
import type { Branding, DocumentModel, PageSize, TemplateId } from './types'

export type { Branding, PageSize, TemplateId }

type FontId = 'geist' | 'geist-mono' | 'source-serif-4' | 'instrument-serif' | 'system'
export type HeaderStyle = 'standard' | 'banner' | 'compact'
export type FooterStyle = 'minimal' | 'standard' | 'detailed'

// FontId to CSS font-family stack (all bundled via @fontsource).
export const FONT_STACKS: Record<FontId, string> = {
  geist: "'Geist Variable', sans-serif",
  'geist-mono': "'Geist Mono Variable', monospace",
  'source-serif-4': "'Source Serif 4 Variable', serif",
  'instrument-serif': "'Instrument Serif', Georgia, serif",
  // Blank template uses the system sans stack, never bundled.
  system: "'Helvetica Neue', Arial, sans-serif",
}

// English document title by type, rendered by the header presets.
export const DOC_TITLES = Object.fromEntries(DOC_TYPE_IDS.map((t) => [t, DOC_TYPES[t].title])) as Record<DocumentModel['type'], string>

// Paper sizes; A4 is the parity harness geometry.
export const PAGE_SIZES: Record<PageSize, { label: string; width: string; height: string }> = {
  a4: { label: 'A4', width: '210mm', height: '297mm' },
  letter: { label: 'US Letter', width: '215.9mm', height: '279.4mm' },
  a5: { label: 'A5', width: '148mm', height: '210mm' },
  a3: { label: 'A3', width: '297mm', height: '420mm' },
}

// Page sizes as select options: value and label.
export const PAGE_SIZE_OPTIONS = Object.entries(PAGE_SIZES).map(([value, size]) => ({ value: value as PageSize, label: size.label }))

// Page geometry in CSS px at 96dpi, derived from A4 794x1123 by ISO aspect; the print-preview dialog slices pages by these.
export const PAGE_SIZE_PX: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 794, height: 1123 },
  letter: { width: 816, height: 1056 },
  a5: { width: Math.round(794 * (148 / 210)), height: Math.round(1123 * (148 / 210)) },
  a3: { width: Math.round(794 * (297 / 210)), height: Math.round(1123 * (297 / 210)) },
}

// A template's style identity.
export interface TemplateTokens {
  palette: {
    ink: string
    // Null when the template has no brand primary (falls back at resolve time).
    primary: string | null
    // Null when the template has no brand accent (resolved via the accent fallback chain).
    accent: string | null
    border: string
    fill: string
    // Secondary/muted text color (footer blurb, small print).
    muted: string
  }
  fonts: {
    headingFontId: FontId
    bodyFontId: FontId
    titleSize: string
    titleWeight: number
    // Body text size; absent is 11px.
    bodySize?: string
    // Label/meta font.
    labelFontId: FontId
    // Letter-spacing for label-style text.
    labelLetterspacing: string
    // Label text color; absent uses the primary color, else ink.
    labelColor?: string
  }
  borders: {
    // Table row rule color (hairline for Minimal).
    rowRule: string
  }
  spacing: {
    sectionGap: string
    pagePadding: string
    // Panel corner radius; '0px' = square.
    radius: string
    // Left page padding when a template reserves a side column; absent uses pagePadding.
    pagePaddingLeft?: string
  }
  header: {
    style: HeaderStyle
    titleLabel: string
  }
  footer: {
    style: FooterStyle
  }
  table: {
    // Table header text color (Minimal gray #6b7280).
    headerText: string
  }
  totals: {
    // Grand-total top rule color (Minimal hairline #e5e7eb).
    rule: string
  }
}

// Template defaults with branding overrides merged in, plus the resolved watermark accent.
export interface ResolvedTokens extends TemplateTokens {
  // branding.accentColor ?? palette.accent ?? palette.primary ?? '#1d4ed8'.
  accent: string
}

// Every published version of each template, oldest first; sent documents keep rendering with the version they recorded.
export const TEMPLATE_VERSIONS: Record<TemplateId, TemplateTokens[]> = {
  blank: [blankTokens],
  minimal: [minimalTokens],
  noirLedger: [noirLedgerTokens],
  atelier: [atelierTokens],
  statement: [statementTokens],
  swiss: [swissTokens],
  correspondence: [correspondenceTokens],
}

// Display name of each template.
export const TEMPLATE_NAMES: Record<TemplateId, string> = {
  blank: 'Blank',
  minimal: 'Minimal',
  noirLedger: 'Noir Ledger',
  atelier: 'Atelier',
  statement: 'Statement',
  swiss: 'Swiss',
  correspondence: 'Correspondence',
}

// The current version of each template; must cover exactly the ids in types.ts (pinned by a unit test).
export const TEMPLATE_REGISTRY = Object.fromEntries(Object.entries(TEMPLATE_VERSIONS).map(([id, versions]) => [id, versions[versions.length - 1]])) as Record<TemplateId, TemplateTokens>
