import type { DocumentModel, TemplateId, PageSize, Branding } from '../document/types'
import { getPlainText } from '../document/richtext'
import { BrandingPanel } from './BrandingPanel'
import { TemplateGallery } from './TemplateGallery'
import { PAGE_SIZES } from '../document/tokens'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CurrencyCard } from './properties/CurrencyCard'
import { ItemProperties } from './properties/ItemProperties'
import { ValidUntilCard } from './properties/ValidUntilCard'

// Right pane: the selected line item's properties, otherwise the document settings.
export interface PropertiesPaneProps {
  model: DocumentModel
  template: TemplateId
  selectedItemId: string | null
  onTemplateChange: (template: TemplateId) => void
  onBrandingChange: (branding: Partial<Branding> | undefined) => void
  onLogoChange: (logo: string | null) => void
  onPageSizeChange: (pageSize: PageSize) => void
  onLineItemChange?: (id: string, patch: Partial<DocumentModel['lineItems'][number]>) => void
  onValidUntilChange?: (date: string | undefined) => void
}

export function PropertiesPane({
  model,
  template,
  selectedItemId,
  onTemplateChange,
  onBrandingChange,
  onLogoChange,
  onPageSizeChange,
  onLineItemChange,
  onValidUntilChange,
}: PropertiesPaneProps) {
  if (selectedItemId !== null) {
    const item = model.lineItems.find((li) => li.id === selectedItemId)
    if (item === undefined) return null
    return <ItemProperties item={item} onLineItemChange={onLineItemChange} />
  }

  const currentPageSize: PageSize = model.pageSize ?? 'a4'
  const docNumber = getPlainText(model.number)

  return (
    <div className="space-y-4">
      <h2 className="px-1 text-sm font-semibold">Document</h2>
      <TemplateGallery selected={template} onSelect={onTemplateChange} />
      <BrandingPanel model={model} template={template} onBrandingChange={onBrandingChange} onLogoChange={onLogoChange} />
      <CurrencyCard currency={model.currency} />
      {model.type === 'quote' && onValidUntilChange && <ValidUntilCard validUntil={model.validUntil} onChange={onValidUntilChange} />}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Page size</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={currentPageSize}
            onValueChange={(next) => {
              if (next !== null && (next === 'a4' || next === 'a5' || next === 'a3')) onPageSizeChange(next)
            }}
          >
            <SelectTrigger className="w-full" aria-label="Page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAGE_SIZES).map(([id, size]) => (
                <SelectItem key={id} value={id}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className="px-1 text-sm">
        <p className="text-xs text-muted-foreground">Document</p>
        <p className="font-medium">
          {model.type.charAt(0).toUpperCase() + model.type.slice(1)} #{docNumber}
        </p>
      </div>
    </div>
  )
}
