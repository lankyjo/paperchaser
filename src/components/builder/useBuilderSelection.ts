import { useState } from 'react'
import type { BlockId } from '../OutlinePane'

const MOBILE_BREAKPOINT = 1024

// Outline selection; on mobile a selected item also opens its bottom sheet, and the canvas scrolls to the target.
export function useBuilderSelection() {
  const [selectedBlockId, setSelectedBlockId] = useState<BlockId | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [sheetItemId, setSheetItemId] = useState<string | null>(null)

  const select = (blockId: BlockId | null, itemId: string | null) => {
    setSelectedBlockId(blockId)
    setSelectedItemId(itemId)
    if (itemId !== null && typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) setSheetItemId(itemId)
    if (blockId !== null || itemId !== null) {
      const target = itemId !== null ? document.querySelector(`[data-item-id="${itemId}"]`) : document.querySelector(`[data-block-id="${blockId}"]`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Drops any selection or open sheet that points at a deleted item.
  const forgetItem = (id: string) => {
    if (selectedItemId === id) setSelectedItemId(null)
    if (sheetItemId === id) setSheetItemId(null)
  }

  return { selectedBlockId, selectedItemId, sheetItemId, select, forgetItem, closeSheet: () => setSheetItemId(null) }
}
