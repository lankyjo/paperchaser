import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { blockActions } from './blockActions'
import { AddSectionMenu } from './AddSectionMenu'
import { SortableBlockRow } from './SortableBlockRow'

// The document's sections: drag to reorder, show or hide, remove, and add from one menu.
export function BlockOutline({ sections }: { sections: ReturnType<typeof blockActions> }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const { blocks } = sections
  const reorder = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) return
    sections.reorderBlocks(blocks.findIndex((b) => b.id === active.id), blocks.findIndex((b) => b.id === over.id))
  }
  return (
    <nav aria-label="Blocks" className="flex flex-col gap-2 text-sm">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-1">
            {blocks.map((block) => (
              <SortableBlockRow
                key={block.id}
                block={block}
                canHide={sections.canHide(block.type)}
                canRemove={sections.canRemove(block.type)}
                onToggleHidden={() => sections.toggleHidden(block.id)}
                onRemove={() => sections.removeBlock(block.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <AddSectionMenu onAdd={sections.addBlock} />
    </nav>
  )
}
