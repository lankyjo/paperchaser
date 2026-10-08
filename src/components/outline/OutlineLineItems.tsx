import { Plus } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { DocumentModel } from '../../document/types'
import { Button } from '../ui/button'
import { SortableOutlineItem } from './SortableOutlineItem'
import { useCollapsedItems } from './useCollapsedItems'

// Line items nested under the Items block: an empty state, or a drag-sortable list plus an add button.
export function OutlineLineItems({
  lineItems,
  selectedItemId,
  onSelectItem,
  onDeleteRequest,
  onAddItem,
  onDuplicate,
  onReorder,
  onMoveUp,
  onMoveDown,
}: {
  lineItems: DocumentModel['lineItems']
  selectedItemId: string | null
  onSelectItem: (itemId: string) => void
  onDeleteRequest: (itemId: string) => void
  onAddItem?: () => void
  onDuplicate?: (id: string) => void
  onReorder?: (oldIndex: number, newIndex: number) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
}) {
  const { collapsedItems, toggleCollapse } = useCollapsedItems()
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) return
    const oldIndex = lineItems.findIndex((i) => i.id === active.id)
    const newIndex = lineItems.findIndex((i) => i.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) onReorder?.(oldIndex, newIndex)
  }

  return (
    <div className="ml-1">
      {lineItems.length === 0 ? (
        <div className="px-1 py-2 text-[13px] text-muted-foreground">
          <p className="mb-1">No items yet</p>
          <p className="text-xs">Add your first line item to start the table.</p>
          {onAddItem && (
            <Button type="button" size="sm" className="mt-2 h-7 text-xs" onClick={(e) => { e.stopPropagation(); onAddItem() }}>
              <Plus className="mr-1 size-3" /> Add item
            </Button>
          )}
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={lineItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {lineItems.map((item, idx) => (
                  <SortableOutlineItem
                    key={item.id}
                    item={item}
                    isSelected={selectedItemId === item.id}
                    isCollapsed={collapsedItems.has(item.id)}
                    onSelect={() => onSelectItem(item.id)}
                    onToggleCollapse={() => toggleCollapse(item.id)}
                    onDuplicate={() => onDuplicate?.(item.id)}
                    onDeleteRequest={() => onDeleteRequest(item.id)}
                    onMoveUp={() => onMoveUp?.(item.id)}
                    onMoveDown={() => onMoveDown?.(item.id)}
                    isFirst={idx === 0}
                    isLast={idx === lineItems.length - 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {onAddItem && (
            <Button type="button" variant="outline" size="sm" className="mt-2 h-7 w-full text-xs" onClick={onAddItem}>
              <Plus className="mr-1 size-3" /> Add item
            </Button>
          )}
        </>
      )}
    </div>
  )
}
