import * as React from 'react'
import { Drawer } from 'vaul'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}

// Half and full height; dragging the handle moves between them or dismisses the sheet.
const SNAP_POINTS = [0.5, 1]

// Draggable bottom sheet (vaul) with a title and close button; focus stays inside while it is open.
export function BottomSheet({ open, onOpenChange, title, children }: BottomSheetProps) {
  const [snap, setSnap] = React.useState<number | string | null>(SNAP_POINTS[0])
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={SNAP_POINTS} activeSnapPoint={snap} setActiveSnapPoint={setSnap}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          data-slot="bottomsheet-content"
          className="fixed inset-x-0 bottom-0 z-50 flex h-full max-h-[96dvh] flex-col rounded-t-xl bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-xl outline-none"
        >
          <div className="flex shrink-0 flex-col items-center gap-2 border-b p-3">
            <Drawer.Handle className="!h-[5px] !w-9 !bg-muted-foreground/30" />
            <div className="flex w-full items-center justify-between gap-2">
              <Drawer.Title className="text-sm font-semibold">{title}</Drawer.Title>
              <Drawer.Close asChild>
                <Button variant="ghost" size="icon-sm" className="size-8" aria-label="Close">
                  <XIcon className="size-4" />
                </Button>
              </Drawer.Close>
            </div>
            <Drawer.Description className="sr-only">{title}</Drawer.Description>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" data-vaul-no-drag>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
