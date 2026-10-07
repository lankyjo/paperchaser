// Choices offered by the branding controls; values match the Branding schema enums.
export const FONT_OPTIONS = [
  { value: 'geist', label: 'Geist' },
  { value: 'geist-mono', label: 'Geist Mono' },
  { value: 'source-serif-4', label: 'Source Serif 4' },
  { value: 'instrument-serif', label: 'Instrument Serif' },
] as const

export const HEADER_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'banner', label: 'Banner' },
  { value: 'compact', label: 'Compact' },
] as const

export const FOOTER_OPTIONS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' },
] as const

export const WATERMARK_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'draft', label: 'Draft' },
  { value: 'paid', label: 'Paid' },
] as const
