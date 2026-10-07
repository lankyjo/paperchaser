import { PAGE_SIZES } from '../../document/tokens'
import type { PageSize } from '../../document/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

// Compact desktop page-size picker for the builder header.
export function PageSizeSelect({ value, onChange }: { value: PageSize; onChange: (pageSize: PageSize) => void }) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next !== null && next in PAGE_SIZES) onChange(next)
      }}
    >
      <SelectTrigger size="sm" aria-label="Page size" className="hidden lg:flex">
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
  )
}
