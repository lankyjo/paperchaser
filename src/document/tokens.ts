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

import { agencyTokens } from './templates/agency'
import { blankTokens } from './templates/blank'
import { corporateTokens } from './templates/corporate'
import { creativeTokens } from './templates/creative'
import { freelancerTokens } from './templates/freelancer'
import { minimalTokens } from './templates/minimal'
import { modernTokens } from './templates/modern'
import type { Branding, PageSize, TemplateId } from './types'

export type { Branding, PageSize, TemplateId }

export type FontId = 'geist' | 'geist-mono' | 'source-serif-4' | 'system'
export type HeaderStyle = 'standard' | 'banner' | 'compact' | 'standard-offset'
export type FooterStyle = 'minimal' | 'standard' | 'detailed'

/** FontId → CSS font-family stack (BRND-04; all bundled via @fontsource). */
export const FONT_STACKS: Record<FontId, string> = {
  geist: "'Geist Variable', sans-serif",
  'geist-mono': "'Geist Mono Variable', monospace",
  'source-serif-4': "'Source Serif 4 Variable', serif",
  // Blank template identity: system sans (UI-SPEC §Template Identity 1) — never bundled.
  system: "'Helvetica Neue', Arial, sans-serif",
}

/**
 * D-05: English document title by type (UI-SPEC language decision — the
 * rendered document copy is English). The header presets render this; the
 * type enum lives in types.ts ('invoice' | 'quote' | 'receipt').
 */
export const DOC_TITLES: Record<'invoice' | 'quote' | 'receipt', string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  receipt: 'Receipt',
}

/** Page sizes (PDF-01/02, Decision 1). A4 is the harness geometry contract. */
export const PAGE_SIZES: Record<PageSize, { label: string; width: string; height: string }> = {
  a4: { label: 'A4', width: '210mm', height: '297mm' },
  a5: { label: 'A5', width: '148mm', height: '210mm' },
  a3: { label: 'A3', width: '297mm', height: '420mm' },
}

/**
 * Page geometry in CSS pixels at 96dpi (plan 03-05, D-15) — the harness raster
 * constants (A4 794×1123, tests/helpers/raster.ts) scaled by ISO aspect for
 * A5/A3: never hardcoded per-size px, always derived from the A4 constants.
 * The print-preview dialog slices page blocks by these; the harness diffs the
 * SAME crops (dialog page i == cropY(printShot, i·pageH, pageH)), so the
 * dialog stays verifiable with the calibrated 0.05/0.06 fractions.
 */
export const PAGE_SIZE_PX: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 794, height: 1123 },
  a5: { width: Math.round(794 * (148 / 210)), height: Math.round(1123 * (148 / 210)) },
  a3: { width: Math.round(794 * (297 / 210)), height: Math.round(1123 * (297 / 210)) },
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
    /** Secondary/muted text color (footer blurb, small print) — UI-SPEC "secondary gray" role. */
    muted: string
  }
  fonts: {
    headingFontId: FontId
    bodyFontId: FontId
    titleSize: string
    titleWeight: number
    /** Branding label/meta font (Agency/Creative mono uppercase labels); plan 03 wires it. */
    labelFontId: FontId
    /** Letter-spacing for label-style text (Agency 0.12em, Minimal 0.08em). */
    labelLetterspacing: string
  }
  borders: {
    /** Table row rule color (hairline for Minimal). */
    rowRule: string
  }
  spacing: {
    sectionGap: string
    pagePadding: string
    /** Decoration band width (Modern 4mm top, Agency 8px top, Creative 8mm left); '0px' = no band. */
    bandWidth: string
    /** Panel/total-card corner radius (Freelancer/Creative 6px, Modern 4px); '0px' = square. */
    radius: string
    /** Creative 18mm left padding (band offset); absent → pagePadding (resolver fallback). */
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
 * Registry seam (D-12): template token files keyed by TemplateId — exactly the
 * 7 ids of the z.enum union in types.ts (TEMP-01; set equality is unit-pinned).
 * Adding a template = adding a token file + one registry line.
 */
export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateTokens> = {
  blank: blankTokens,
  minimal: minimalTokens,
  modern: modernTokens,
  corporate: corporateTokens,
  freelancer: freelancerTokens,
  agency: agencyTokens,
  creative: creativeTokens,
}
