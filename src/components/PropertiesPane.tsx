import type { DocumentModel, TemplateId, PageSize, Branding } from '../document/types'
import { getPlainText } from '../document/richtext'
import { BrandingPanel } from './BrandingPanel'
import { TemplateGallery } from './TemplateGallery'
import { PAGE_SIZES } from '../document/tokens'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

/**
 * Right-pane properties (D-02 discretion): selected-element properties
 * when a line item is selected, else document settings (template gallery,
 * branding, page size, document title/number).
 *
 * Instant-apply pattern (BrandingPanel precedent): every control routes
 * through the builder's commit() so undo/save cover it (D-13).
 */

interface PropertiesPaneProps {
  model: DocumentModel
  template: TemplateId
  selectedItemId: string | null
  onTemplateChange: (template: TemplateId) => void
  onBrandingChange: (branding: Partial<Branding> | undefined) => void
  onLogoChange: (logo: string | null) => void
  onPageSizeChange: (pageSize: PageSize) => void
}

export function PropertiesPane({
  model,
  template,
  selectedItemId,
  onTemplateChange,
  onBrandingChange,
  onLogoChange,
  onPageSizeChange,
}: PropertiesPaneProps) {
  // When a line item is selected, show its properties
  if (selectedItemId !== null) {
    const item = model.lineItems.find((li) => li.id === selectedItemId)
    if (item === undefined) return null

    return (
      <div className="space-y-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="text-sm">{getPlainText(item.title)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{getPlainText(item.description)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="text-sm">{item.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit price</p>
              <p className="text-sm">{(item.unitPriceMinor / 100).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default: document settings
  const currentPageSize: PageSize = model.pageSize ?? 'a4'
  const docNumber = getPlainText(model.number)

  return (
    <div className="space-y-4">
      <h2 className="px-1 text-sm font-semibold">Document</h2>

      <TemplateGallery selected={template} onSelect={onTemplateChange} />

      <BrandingPanel
        model={model}
        template={template}
        onBrandingChange={onBrandingChange}
        onLogoChange={onLogoChange}
      />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Page size</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={currentPageSize}
            onValueChange={(next) => {
              if (next !== null && (next === 'a4' || next === 'a5' || next === 'a3')) {
                onPageSizeChange(next)
              }
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

      {/* Document title/number display */}
      <div className="px-1 text-sm">
        <p className="text-xs text-muted-foreground">Document</p>
        <p className="font-medium">
          {model.type.charAt(0).toUpperCase() + model.type.slice(1)} #{docNumber}
        </p>
      </div>
    </div>
  )
}
