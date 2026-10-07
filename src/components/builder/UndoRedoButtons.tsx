import { Undo2, Redo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Undo and redo icon buttons, dimmed when their stack is empty.
export function UndoRedoButtons({
  className,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  className: string
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  return (
    <div className={className}>
      <button type="button" aria-label="Undo" disabled={!canUndo} onClick={onUndo} className={cn('rounded p-1 hover:bg-foreground/10', !canUndo && 'opacity-30')}>
        <Undo2 className="size-4" />
      </button>
      <button type="button" aria-label="Redo" disabled={!canRedo} onClick={onRedo} className={cn('rounded p-1 hover:bg-foreground/10', !canRedo && 'opacity-30')}>
        <Redo2 className="size-4" />
      </button>
    </div>
  )
}
