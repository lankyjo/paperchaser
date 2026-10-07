// Template token registry: each template is a plain token object in src/document/templates/; no React, DOM or Dexie.

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

// FontId to CSS font-family stack (all bundled via @fontsource).
export const FONT_STACKS: Record<FontId, string> = {
  geist: "'Geist Variable', sans-serif",
  'geist-mono': "'Geist Mono Variable', monospace",
  'source-serif-4': "'Source Serif 4 Variable', serif",
  // Blank template uses the system sans stack, never bundled.
  system: "'Helvetica Neue', Arial, sans-serif",
}

// English document title by type, rendered by the header presets.
export const DOC_TITLES: Record<'invoice' | 'quote' | 'receipt', string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  receipt: 'Receipt',
}

// Paper sizes; A4 is the parity harness geometry.
export const PAGE_SIZES: Record<PageSize, { label: string; width: string; height: string }> = {
  a4: { label: 'A4', width: '210mm', height: '297mm' },
  a5: { label: 'A5', width: '148mm', height: '210mm' },
  a3: { label: 'A3', width: '297mm', height: '420mm' },
}

// Page geometry in CSS px at 96dpi, derived from A4 794x1123 by ISO aspect; the print-preview dialog slices pages by these.
export const PAGE_SIZE_PX: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 794, height: 1123 },
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
    // Label/meta font (Agency/Creative mono uppercase labels).
    labelFontId: FontId
    // Letter-spacing for label-style text (Agency 0.12em, Minimal 0.08em).
    labelLetterspacing: string
  }
  borders: {
    // Table row rule color (hairline for Minimal).
    rowRule: string
  }
  spacing: {
    sectionGap: string
    pagePadding: string
    // Decoration band width (Modern 4mm top, Agency 8px top, Creative 8mm left); '0px' = no band.
    bandWidth: string
    // Panel/total-card corner radius (Freelancer/Creative 6px, Modern 4px); '0px' = square.
    radius: string
    // Creative 18mm left padding (band offset); absent falls back to pagePadding.
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

// Template tokens keyed by TemplateId; must cover exactly the ids in types.ts (pinned by a unit test).
export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateTokens> = {
  blank: blankTokens,
  minimal: minimalTokens,
  modern: modernTokens,
  corporate: corporateTokens,
  freelancer: freelancerTokens,
  agency: agencyTokens,
  creative: creativeTokens,
}
