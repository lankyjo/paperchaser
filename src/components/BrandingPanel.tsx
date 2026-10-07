import type { Branding, DocumentModel, TemplateId } from '../document/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { FONT_OPTIONS, FOOTER_OPTIONS, HEADER_OPTIONS } from './branding/brandingOptions'
import { ColorControl } from './branding/ColorControl'
import { LogoControl } from './branding/LogoControl'
import { ResetBrandingControl } from './branding/ResetBrandingControl'
import { SelectControl } from './branding/SelectControl'
import { useBrandingDisplay } from './branding/useBrandingDisplay'
import { WatermarkControl } from './branding/WatermarkControl'

// Per-document branding controls; every change applies instantly by patching the document's branding object.
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
  const display = useBrandingDisplay(branding, template)
  const setBranding = (patch: Partial<Branding>) => onBrandingChange?.({ ...branding, ...patch })

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LogoControl model={model} onLogoChange={onLogoChange} />

        <ColorControl
          label="Primary color"
          value={display.primaryValue}
          swatches={display.swatches}
          onPick={(hex) => setBranding({ primaryColor: hex })}
        />
        <ColorControl
          label="Accent color"
          value={display.accentValue}
          swatches={display.swatches}
          onPick={(hex) => setBranding({ accentColor: hex })}
        />

        <SelectControl
          label="Heading font"
          value={display.headingFont}
          options={FONT_OPTIONS}
          onPick={(value) => setBranding({ headingFont: value as Branding['headingFont'] })}
        />
        <SelectControl
          label="Body font"
          value={display.bodyFont}
          options={FONT_OPTIONS}
          onPick={(value) => setBranding({ bodyFont: value as Branding['bodyFont'] })}
        />
        <SelectControl
          label="Header style"
          value={display.headerStyle}
          options={HEADER_OPTIONS}
          onPick={(value) => setBranding({ headerStyle: value as Branding['headerStyle'] })}
        />
        <SelectControl
          label="Footer style"
          value={display.footerStyle}
          options={FOOTER_OPTIONS}
          onPick={(value) => setBranding({ footerStyle: value as Branding['footerStyle'] })}
        />

        <WatermarkControl watermark={display.watermark} onPick={(watermark) => setBranding({ watermark })} />

        <ResetBrandingControl template={template} onReset={() => onBrandingChange?.(undefined)} />
      </CardContent>
    </Card>
  )
}
