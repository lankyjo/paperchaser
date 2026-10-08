import { Menu } from '@base-ui/react/menu'
import { Plus } from 'lucide-react'
import type { BlockType } from '../../document/blocks'
import { ADDABLE_BLOCK_TYPES } from '../../document/documentBlocks'
import { BLOCK_LABELS } from '../../strings/blockLabels'
import { Button } from '../ui/button'

// One "Add section" button; the section types open in a menu under it.
export function AddSectionMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="outline" size="sm" className="w-full justify-center" />}>
        <Plus />
        Add section
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Menu.Popup className="max-h-80 min-w-48 overflow-y-auto rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-lg outline-none">
            {ADDABLE_BLOCK_TYPES.map((type) => (
              <Menu.Item key={type} onClick={() => onAdd(type)} className="cursor-default rounded-md px-2.5 py-1.5 outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground">
                {BLOCK_LABELS[type]}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
