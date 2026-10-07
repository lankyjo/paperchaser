import { ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_ZOOM, MIN_ZOOM } from './useCanvasZoom'

// Desktop-only zoom out / percentage / zoom in controls.
export function ZoomControls({ zoom, onZoomIn, onZoomOut }: { zoom: number; onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="hidden items-center gap-1 lg:flex">
      <button type="button" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={onZoomOut} className={cn('rounded p-1 hover:bg-foreground/10', zoom <= MIN_ZOOM && 'opacity-30')}>
        <ZoomOut className="size-4" />
      </button>
      <span className="min-w-[3ch] text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={onZoomIn} className={cn('rounded p-1 hover:bg-foreground/10', zoom >= MAX_ZOOM && 'opacity-30')}>
        <ZoomIn className="size-4" />
      </button>
    </div>
  )
}
