import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Bottom sheet built on the Base UI dialog, since react-spring-bottom-sheet lacks React 19 support.
interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onOpenChange, title, children }: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="bottomsheet-backdrop"
          className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          data-slot="bottomsheet-content"
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-xl bg-popover text-popover-foreground shadow-xl',
            'data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom duration-300',
            'pb-[env(safe-area-inset-bottom)]',
          )}
        >
          <div className="flex shrink-0 flex-col items-center gap-2 border-b p-3">
            <div className="h-[5px] w-9 rounded-full bg-muted-foreground/30" aria-hidden="true" />
            <div className="flex w-full items-center justify-between gap-2">
              {title ? <DialogPrimitive.Title className="text-sm font-semibold">{title}</DialogPrimitive.Title> : <span />}
              <DialogPrimitive.Close
                render={<Button variant="ghost" size="icon-sm" className="size-8" />}
                aria-label="Close"
              >
                <XIcon className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
