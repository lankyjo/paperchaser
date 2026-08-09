import { useRef, useState } from 'react'

import { resolveTokens } from '../document/resolveTokens'
import type { Branding, DocumentModel, TemplateId } from '../document/types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

/**
 * BrandingPanel — the per-document branding surface (BRND-01..06, UI-SPEC
 * §Branding Controls) in the bench's left rail, below TemplateGallery.
 *
 * Every control is instant-apply (WYSIWYG — no Apply button): it patches the
 * loaded document's branding object (D-01, per-document) and calls
 * onBrandingChange / onLogoChange; the demo path persists via
 * documentsRepo.put (the panel and DocumentPage read the SAME object — the
 * document's `branding` prop). Unset fields show — and resolve to — the active
 * template's defaults (D-02); "Reset branding" clears the object entirely.
 *
 * D-03: there is NO branding.logo field — the logo control writes
 * company.logo (one source of truth), the only logo the header renders.
 *
 * Logo gate (T-03-02): type allowlist (PNG/JPG/SVG) + size <= 2 MB enforced
 * at READ time BEFORE FileReader.readAsDataURL — a rejected file shows the
 * inline error copy with NO state change.
 *
 * No hardcoded document colors/fonts: every preset swatch and default is
 * derived from the active template's resolved tokens (grep-enforced).
 */
const LOGO_ACCEPT = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_LOGO_BYTES = 2 * 1024 * 1024

const FONT_OPTIONS = [
  { value: 'geist', label: 'Geist' },
  { value: 'geist-mono', label: 'Geist Mono' },
  { value: 'source-serif-4', label: 'Source Serif 4' },
] as const

const HEADER_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'banner', label: 'Banner' },
  { value: 'compact', label: 'Compact' },
] as const

const FOOTER_OPTIONS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' },
] as const

const WATERMARK_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'draft', label: 'Draft' },
  { value: 'paid', label: 'Paid' },
] as const

export function BrandingPanel({
  model,
  template,
  onBrandingChange,
  onLogoChange,
}: {
  model: DocumentModel
  template: TemplateId
  onBrandingChange?: (branding: Partial<Branding> | undefined) => void
  onLogoChange?: (logo: string | null) => void
}) {
  const branding = model.branding ?? {}
  const resolved = resolveTokens(template)
  const [confirming, setConfirming] = useState<'logo' | 'reset' | null>(null)

  // D-02 presets: the ACTIVE template's resolved tokens (ink/primary/accent/border).
  const swatches = [
    resolved.palette.ink,
    resolved.palette.primary ?? resolved.palette.ink,
    resolved.accent,
    resolved.palette.border,
  ]

  const setBranding = (patch: Partial<Branding>) => onBrandingChange?.({ ...branding, ...patch })

  const primaryValue = branding.primaryColor ?? resolved.palette.primary ?? resolved.palette.ink
  const accentValue = branding.accentColor ?? resolved.accent

  // Display the resolved default only when it is a valid select option
  // (e.g. Blank's 'system' font is not a brandable override).
  const headingFont = FONT_OPTIONS.some((o) => o.value === (branding.headingFont ?? resolved.fonts.headingFontId))
    ? (branding.headingFont ?? resolved.fonts.headingFontId)
    : null
  const bodyFont = FONT_OPTIONS.some((o) => o.value === (branding.bodyFont ?? resolved.fonts.bodyFontId))
    ? (branding.bodyFont ?? resolved.fonts.bodyFontId)
    : null
  // standard-offset (Creative) renders HeaderStandard — display as Standard.
  const headerStyle = (branding.headerStyle ??
    (resolved.header.style === 'standard-offset' ? 'standard' : resolved.header.style)) as
    | (typeof HEADER_OPTIONS)[number]['value']
    | null
  const footerStyle = FOOTER_OPTIONS.some((o) => o.value === (branding.footerStyle ?? resolved.footer.style))
    ? (branding.footerStyle ?? resolved.footer.style)
    : null
  const watermark = branding.watermark ?? 'auto'

  const templateName = template.charAt(0).toUpperCase() + template.slice(1)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LogoControl model={model} onLogoChange={onLogoChange} />

        <ColorControl
          label="Primary color"
          value={primaryValue}
          swatches={swatches}
          onPick={(hex) => setBranding({ primaryColor: hex })}
        />
        <ColorControl
          label="Accent color"
          value={accentValue}
          swatches={swatches}
          onPick={(hex) => setBranding({ accentColor: hex })}
        />

        <SelectControl
          label="Heading font"
          value={headingFont}
          options={FONT_OPTIONS}
          onPick={(value) => setBranding({ headingFont: value as Branding['headingFont'] })}
        />
        <SelectControl
          label="Body font"
          value={bodyFont}
          options={FONT_OPTIONS}
          onPick={(value) => setBranding({ bodyFont: value as Branding['bodyFont'] })}
        />
        <SelectControl
          label="Header style"
          value={headerStyle}
          options={HEADER_OPTIONS}
          onPick={(value) => setBranding({ headerStyle: value as Branding['headerStyle'] })}
        />
        <SelectControl
          label="Footer style"
          value={footerStyle}
          options={FOOTER_OPTIONS}
          onPick={(value) => setBranding({ footerStyle: value as Branding['footerStyle'] })}
        />

        <div className="space-y-1.5">
          <Label>Watermark</Label>
          <div className="flex gap-3" role="radiogroup" aria-label="Watermark">
            {WATERMARK_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="watermark"
                  value={option.value}
                  checked={watermark === option.value}
                  onChange={() => setBranding({ watermark: option.value as Branding['watermark'] })}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {confirming === 'reset' ? (
          <div className="space-y-2 rounded-lg border border-destructive/40 p-2">
            <p className="text-sm font-medium">Reset branding?</p>
            <p className="text-xs text-muted-foreground">
              Returns colors, fonts, and header/footer to the {templateName} defaults.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onBrandingChange?.(undefined)
                  setConfirming(null)
                }}
              >
                Reset
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => setConfirming('reset')}>
            Reset branding
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/** BRND-01/D-03: file gate at read, then data: URL into company.logo. */
function LogoControl({
  model,
  onLogoChange,
}: {
  model: DocumentModel
  onLogoChange?: (logo: string | null) => void
}) {
  const [logoError, setLogoError] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasLogo = model.company.logo !== null

  const handleFile = (file: File | undefined) => {
    if (file === undefined) return
    // T-03-02: reject type/size BEFORE readAsDataURL — no state change on reject.
    if (!LOGO_ACCEPT.includes(file.type) || file.size > MAX_LOGO_BYTES) {
      setLogoError(true)
      return
    }
    setLogoError(false)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onLogoChange?.(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      {hasLogo ? (
        <div className="flex items-center gap-2">
          {/* Fixed 48px chip — the source image is never laid out at natural size (T-03-02). */}
          <img
            src={model.company.logo ?? undefined}
            alt=""
            className="size-12 rounded object-cover ring-1 ring-foreground/10"
          />
          <Button type="button" variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            Remove logo
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium">No logo</p>
          <p className="text-xs text-muted-foreground">Add a logo and it appears in the document header.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Add logo
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPG or SVG up to 2 MB</p>
        </>
      )}

      {logoError && (
        <p className="text-xs text-destructive">Couldn't load that file. Use a PNG, JPG or SVG up to 2 MB.</p>
      )}

      {confirming && (
        <div className="space-y-2 rounded-lg border border-destructive/40 p-2">
          <p className="text-sm font-medium">Remove logo?</p>
          <p className="text-xs text-muted-foreground">
            Your logo is removed from this document's branding. You can add it again.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onLogoChange?.(null)
                setConfirming(false)
              }}
            >
              Remove
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          // Allow re-selecting the same file after a rejected/removed pick.
          event.target.value = ''
        }}
      />
    </div>
  )
}

/** BRND-02/03: native color input + 4 presets from the active template's tokens. */
function ColorControl({
  label,
  value,
  swatches,
  onPick,
}: {
  label: string
  value: string
  swatches: string[]
  onPick: (hex: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onPick(event.target.value)}
          className="size-8 cursor-pointer rounded border border-input bg-transparent"
        />
        <div className="flex gap-1.5">
          {swatches.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${label}: ${color}`}
              onClick={() => onPick(color)}
              className="size-5 rounded-full ring-1 ring-inset ring-foreground/15"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** BRND-04/05: shadcn Select bound to a branding enum field. */
function SelectControl({
  label,
  value,
  options,
  onPick,
}: {
  label: string
  value: string | null
  options: ReadonlyArray<{ value: string; label: string }>
  onPick: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null && typeof next === 'string') onPick(next)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
