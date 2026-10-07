import { useState } from 'react'

// Set of line-item ids whose description is collapsed in the outline.
export function useCollapsedItems() {
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set())

  const toggleCollapse = (itemId: string) => {
    setCollapsedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  return { collapsedItems, toggleCollapse }
}
