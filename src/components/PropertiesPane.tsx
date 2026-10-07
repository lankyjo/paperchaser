import type { DocumentModel, TemplateId, PageSize, Branding } from '../document/types'
import { DOC_TYPES } from '../document/docTypes'
import { getPlainText } from '../document/richtext'
import { BrandingPanel } from './BrandingPanel'
import { TemplateGallery } from './TemplateGallery'
import { PAGE_SIZE_OPTIONS, PAGE_SIZES } from '../document/tokens'
import { pageSizeFor } from '../document/pageLayout'
import { isMoneyDocument } from '../document/documentBlocks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CurrencyCard } from './properties/CurrencyCard'
import { ItemProperties } from './properties/ItemProperties'
import { DateCard } from './properties/DateCard'

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
  onDueDateChange?: (date: string | undefined) => void
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
  onDueDateChange,
}: PropertiesPaneProps) {
  if (selectedItemId !== null) {
    const item = model.lineItems.find((li) => li.id === selectedItemId)
    if (item === undefined) return null
    return <ItemProperties item={item} currency={model.currency} locale={model.locale} onLineItemChange={onLineItemChange} />
  }

  const currentPageSize: PageSize = pageSizeFor(model)
  const docNumber = getPlainText(model.number)
  const dateField = DOC_TYPES[model.type].dateField

  return (
    <div className="space-y-4">
      <h2 className="px-1 text-sm font-semibold">Document</h2>
      <TemplateGallery selected={template} onSelect={onTemplateChange} />
      <BrandingPanel model={model} template={template} onBrandingChange={onBrandingChange} onLogoChange={onLogoChange} />
      {isMoneyDocument(model) && <CurrencyCard currency={model.currency} />}
      {dateField === 'validUntil' && onValidUntilChange && <DateCard title="Valid until" value={model.validUntil} onChange={onValidUntilChange} />}
      {dateField === 'dueDate' && onDueDateChange && <DateCard title="Due date" value={model.dueDate} onChange={onDueDateChange} />}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Page size</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            items={PAGE_SIZE_OPTIONS}
            value={currentPageSize}
            onValueChange={(next) => {
              if (next !== null && next in PAGE_SIZES) onPageSizeChange(next)
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
