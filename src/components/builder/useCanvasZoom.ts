import { useState } from 'react'

export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2

const clampZoom = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(v * 10) / 10))

// Desktop canvas zoom in 10% steps between 50% and 200%.
export function useCanvasZoom() {
  const [zoom, setZoom] = useState(1)
  return {
    zoom,
    zoomIn: () => setZoom((z) => clampZoom(z + 0.1)),
    zoomOut: () => setZoom((z) => clampZoom(z - 0.1)),
  }
}
