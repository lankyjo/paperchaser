import { useState, type FormEvent } from 'react'
import { minorToRaw, parseToMinor } from '../../document/money'
import type { CatalogItem } from '../../project/catalog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

// Name, description, usual price and tax rate of one saved service.
export function ServiceForm({ item, onSave }: { item: CatalogItem; onSave: (next: CatalogItem) => void }) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description)
  const [price, setPrice] = useState(item.priceMinor ? minorToRaw(item.priceMinor, 'EUR') : '')
  const [tax, setTax] = useState(String(item.taxRateMinor / 100))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({ ...item, name: name.trim(), description, priceMinor: parseToMinor(price, 'EUR') ?? 0, taxRateMinor: Math.round((Number(tax) || 0) * 100) })
  }
  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[2fr_3fr_1fr_1fr_auto]">
      <Input aria-label="Service name" placeholder="Service" value={name} onChange={(e) => setName(e.target.value)} />
      <Input aria-label="Service description" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input aria-label="Price" inputMode="decimal" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Input aria-label="Tax %" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} />
      <Button type="submit" disabled={name.trim() === ''}>
        Save
      </Button>
    </form>
  )
}
