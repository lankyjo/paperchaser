/**
 * Data-driven token registry for document templates (D-12).
 *
 * Nothing in this file may depend on React, the DOM, or Dexie — Node-testable
 * by construction (mirrors the totals.ts module contract).
 *
 * Templates are plain TS token objects (palette, fonts, borders, spacing,
 * header/footer, table, totals — mirroring the UI-SPEC identity tables).
 * Adding a template = adding a token file in src/document/templates/.
 */

import { minimalTokens } from './templates/minimal'
import type { Branding, PageSize, TemplateId } from './types'

export type { Branding, PageSize, TemplateId }

export type FontId = 'geist' | 'geist-mono' | 'source-serif-4'
export type HeaderStyle = 'standard' | 'banner' | 'compact'
export type FooterStyle = 'minimal' | 'standard' | 'detailed'

/** FontId → CSS font-family stack (BRND-04; all bundled via @fontsource). */
export const FONT_STACKS: Record<FontId, string> = {
  geist: "'Geist Variable', sans-serif",
  'geist-mono': "'Geist Mono Variable', monospace",
  'source-serif-4': "'Source Serif 4 Variable', serif",
}

/** Page sizes (PDF-01/02, Decision 1). A4 is the harness geometry contract. */
export const PAGE_SIZES: Record<PageSize, { label: string; width: string; height: string }> = {
  a4: { label: 'A4', width: '210mm', height: '297mm' },
  a5: { label: 'A5', width: '148mm', height: '210mm' },
  a3: { label: 'A3', width: '297mm', height: '420mm' },
}

/** A template's style identity — values VERBATIM from the UI-SPEC identity tables. */
export interface TemplateTokens {
  palette: {
    ink: string
    /** Null when the template defines no brand primary (falls back at resolve time). */
    primary: string | null
    /** Null when the template defines no brand accent (D-04 chain resolves it). */
    accent: string | null
    border: string
    fill: string
  }
  fonts: {
    headingFontId: FontId
    bodyFontId: FontId
    titleSize: string
    titleWeight: number
  }
  borders: {
    /** Table row rule color (hairline for Minimal). */
    rowRule: string
  }
  spacing: {
    sectionGap: string
    pagePadding: string
  }
  header: {
    style: HeaderStyle
    titleLabel: string
  }
  footer: {
    style: FooterStyle
  }
  table: {
    /** Table header text color (Minimal gray #6b7280). */
    headerText: string
  }
  totals: {
    /** Grand-total top rule color (Minimal hairline #e5e7eb). */
    rule: string
  }
}

/**
 * Resolved = template defaults with branding overrides merged in (D-02),
 * plus the D-04 watermark accent.
 */
export interface ResolvedTokens extends TemplateTokens {
  /** D-04: watermark accent — branding.accentColor ?? palette.accent ?? palette.primary ?? '#1d4ed8'. */
  accent: string
}

/**
 * Registry seam (D-12): template token files keyed by TemplateId.
 * This tracer ships Minimal only (TEMP-01 partial); plans 02/03 add the rest.
 * The `Record<TemplateId, …>` type is the contract once all 7 land — the cast
 * documents that the other six are unregistered during the tracer slice.
 */
export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateTokens> = {
  minimal: minimalTokens,
} as Record<TemplateId, TemplateTokens>
