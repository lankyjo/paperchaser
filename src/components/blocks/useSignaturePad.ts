import { useRef, type PointerEvent } from 'react'
import { opaqueBounds } from '../../lib/opaqueBounds'

// Freehand drawing on a canvas with mouse, pen or finger, exported as a whitespace-trimmed PNG.
export function useSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width, y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height }
  }

  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => {
      const ctx = e.currentTarget.getContext('2d')
      if (!ctx) return
      drawing.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      const { x, y } = point(e)
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#111111'
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return
      const ctx = e.currentTarget.getContext('2d')
      const { x, y } = point(e)
      ctx?.lineTo(x, y)
      ctx?.stroke()
    },
    onPointerUp: () => {
      drawing.current = false
    },
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  const exportTrimmed = (): { dataUrl: string; width: number; height: number } | null => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return null
    const box = opaqueBounds(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, 8)
    if (box === null) return null
    const out = document.createElement('canvas')
    out.width = box.width
    out.height = box.height
    out.getContext('2d')?.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height)
    return { dataUrl: out.toDataURL('image/png'), width: box.width, height: box.height }
  }

  return { canvasRef, handlers, clear, exportTrimmed }
}
