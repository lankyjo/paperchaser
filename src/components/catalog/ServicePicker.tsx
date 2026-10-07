import { lineItemFromService } from '../../project/catalog'
import type { DocumentModel } from '../../document/types'
import { useCatalog } from './useCatalog'

// Adds a saved service as a line item in one pick; hidden when there are no saved services.
export function ServicePicker({ onInsert }: { onInsert: (line: DocumentModel['lineItems'][number]) => void }) {
  const { items } = useCatalog()
  if (items.length === 0) return null
  return (
    <select
      aria-label="Add from services"
      className="mt-3 h-8 w-full rounded-md border bg-transparent px-2 text-sm"
      value=""
      onChange={(e) => {
        const service = items.find((i) => i.id === e.target.value)
        if (service) onInsert(lineItemFromService(service, crypto.randomUUID()))
      }}
    >
      <option value="">Add from services…</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  )
}
