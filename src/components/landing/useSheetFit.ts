import { useCallback } from 'react'

export const SHEET_WIDTH = 540
export const SHEET_HEIGHT = (SHEET_WIDTH * 297) / 210

// Sets --fit on the box so an A4 sheet fills at most `heightShare` of its height and all of its width, never above natural size.
export function useSheetFit(heightShare: number) {
  return useCallback(
    (box: HTMLElement | null) => {
      if (!box) return
      const ro = new ResizeObserver(() => {
        const fit = Math.min(1, box.clientWidth / SHEET_WIDTH, (box.clientHeight * heightShare) / SHEET_HEIGHT)
        box.style.setProperty('--fit', fit.toFixed(3))
      })
      ro.observe(box)
      return () => ro.disconnect()
    },
    [heightShare],
  )
}
