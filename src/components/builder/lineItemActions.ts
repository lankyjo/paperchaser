import type { DocumentModel } from '../../document/types'

type LineItem = DocumentModel['lineItems'][number]

// Line-item add/duplicate/delete/reorder operations; each commits a new model so undo covers it.
export function lineItemActions(model: DocumentModel, commit: (next: DocumentModel) => void) {
  const commitItems = (lineItems: LineItem[]) => commit({ ...model, lineItems })
  const indexOf = (id: string) => model.lineItems.findIndex((li) => li.id === id)

  const reorderItems = (oldIndex: number, newIndex: number) => {
    const next = [...model.lineItems]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    commitItems(next)
  }

  return {
    insertItem: (line: LineItem) => commitItems([...model.lineItems, line]),
    addItem: () =>
      commitItems([
        ...model.lineItems,
        { id: crypto.randomUUID(), title: '', description: '', quantity: 1, unitPriceMinor: 0, taxRateMinor: 0 },
      ]),
    duplicateItem: (id: string) => {
      const idx = indexOf(id)
      if (idx === -1) return
      // JSON round-trip deep-clones the rich-text node arrays.
      const cloned = JSON.parse(JSON.stringify(model.lineItems[idx])) as LineItem
      cloned.id = crypto.randomUUID()
      const next = [...model.lineItems]
      next.splice(idx + 1, 0, cloned)
      commitItems(next)
    },
    deleteItem: (id: string) => commitItems(model.lineItems.filter((li) => li.id !== id)),
    reorderItems,
    moveItemUp: (id: string) => {
      const idx = indexOf(id)
      if (idx > 0) reorderItems(idx, idx - 1)
    },
    moveItemDown: (id: string) => {
      const idx = indexOf(id)
      if (idx !== -1 && idx < model.lineItems.length - 1) reorderItems(idx, idx + 1)
    },
    changeLineItem: (id: string, patch: Partial<LineItem>) =>
      commitItems(model.lineItems.map((li) => (li.id === id ? ({ ...li, ...patch } as LineItem) : li))),
  }
}
