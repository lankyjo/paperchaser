import { useRef } from 'react'
import type { DocumentModel, TemplateId, PageSize, Branding } from '../document/types'
import { getPlainText } from '../document/richtext'
import { BrandingPanel } from './BrandingPanel'
import { TemplateGallery } from './TemplateGallery'
import { PAGE_SIZES } from '../document/tokens'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Label } from './ui/label'

/**
 * Right-pane properties (D-02): selected-element when line item selected,
 * else document settings. Enhanced in 04-04: image file upload for LINE-01
 * (FileReader → data:-URL, reusing BrandingPanel file-input pattern, Zod
 * refine enforces data:-URL-only at commit boundary).
 */
interface PropertiesPaneProps {
  model: DocumentModel
  template: TemplateId
  selectedItemId: string | null
  onTemplateChange: (template: TemplateId) => void
  onBrandingChange: (branding: Partial<Branding> | undefined) => void
  onLogoChange: (logo: string | null) => void
  onPageSizeChange: (pageSize: PageSize) => void
  onCurrencyChange?: (currency: DocumentModel['currency']) => void
  onLineItemChange?: (id: string, patch: Partial<DocumentModel['lineItems'][number]>) => void
}

export function PropertiesPane({
  model,
  template,
  selectedItemId,
  onTemplateChange,
  onBrandingChange,
  onLogoChange,
  onPageSizeChange,
  onCurrencyChange,
  onLineItemChange,
}: PropertiesPaneProps) {
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
              <p className="text-sm">{getPlainText(item.title) || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{getPlainText(item.description) || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="text-sm">{item.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit price</p>
                <p className="text-sm">{(item.unitPriceMinor / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tax</p>
                <p className="text-sm">{(item.taxRateMinor / 100).toFixed(2)}%</p>
              </div>
              {item.discount !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Discount</p>
                  <p className="text-sm">{item.discount.kind === 'percent' ? `${(item.discount.value / 100).toFixed(2)}%` : `${(item.discount.value / 100).toFixed(2)}`}</p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Editing happens inline on the canvas (D-02).</p>
            <ItemImageField image={item.image} onChange={(dataUrl) => onLineItemChange?.(item.id, { image: dataUrl ?? undefined })} onRemove={() => onLineItemChange?.(item.id, { image: undefined })} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentPageSize: PageSize = model.pageSize ?? 'a4'
  const docNumber = getPlainText(model.number)

  return (
    <div className="space-y-4">
      <h2 className="px-1 text-sm font-semibold">Document</h2>
      <TemplateGallery selected={template} onSelect={onTemplateChange} />
      <BrandingPanel model={model} template={template} onBrandingChange={onBrandingChange} onLogoChange={onLogoChange} />
      <Card size="sm">
        <CardHeader>
          <CardTitle>Currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Select
            value={model.currency}
            onValueChange={(next) => {
              if (next !== null && (next === 'EUR' || next === 'JPY')) {
                // ponytail: display-only switch, frankfurter fetch for rates is optional. Full conversion if throughput matters.
                const doSwitch = () => onCurrencyChange?.(next as DocumentModel['currency'])
                if (model.currency !== next) {
                  // Try frankfurter for info only, fallback to direct switch
                  fetch(`https://api.frankfurter.app/latest?from=${model.currency}&to=${next}`)
                    .then((r) => r.json())
                    .then(() => doSwitch())
                    .catch(() => doSwitch())
                  // Ensure switch happens even if fetch hangs — optimistic
                  setTimeout(doSwitch, 300)
                }
              }
            }}
          >
            <SelectTrigger className="w-full" aria-label="Currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR — Euro (2dp)</SelectItem>
              <SelectItem value="JPY">JPY — Yen (0dp)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">EUR uses 2 decimals, JPY uses 0. Stored amounts keep their minor units.</p>
        </CardContent>
      </Card>
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

/** LINE-01: optional line-item image via FileReader → data:-URL, thumbnail preview. */
function ItemImageField({ image, onChange, onRemove }: { image?: string; onChange: (dataUrl: string | null) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (file === undefined) return
    // ponytail: no size limit; schema is data:-URL-only, FileReader naturally produces data:-URL
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <Label>Image</Label>
      {image ? (
        <div className="space-y-2">
          <img src={image} alt="" className="max-h-24 max-w-full rounded object-contain ring-1 ring-foreground/10" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Add image
          </Button>
          <p className="text-xs text-muted-foreground">Optional image shown in the item row.</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}
