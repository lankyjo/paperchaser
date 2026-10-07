import { useState, type RefObject } from 'react'
import { useMountEffect } from '../../hooks/useMountEffect'
import { NO_ACTIVE_FORMATS, readActiveFormats } from './readActiveFormats'

const HEADER_CLEARANCE = 56
const GAP = 12
const EDGE_MARGIN = 16

function selectionInside(el: HTMLElement): Selection | null {
  const sel = window.getSelection()
  const activeEl = document.activeElement as HTMLElement | null
  const isFocused = activeEl !== null && (activeEl === el || el.contains(activeEl))
  const hasSelection =
    sel !== null &&
    !sel.isCollapsed &&
    sel.rangeCount > 0 &&
    ((sel.anchorNode !== null && el.contains(sel.anchorNode)) ||
      (sel.focusNode !== null && el.contains(sel.focusNode)) ||
      sel.anchorNode === (el as unknown as Node))
  return isFocused && hasSelection ? sel : null
}

// Places the toolbar above the selection, below it when it would hit the app header, clamped to the viewport.
function placeToolbar(rect: DOMRect, toolbar: HTMLElement | null) {
  const width = toolbar !== null && toolbar.offsetWidth > 0 ? toolbar.offsetWidth : 220
  const height = toolbar !== null && toolbar.offsetHeight > 0 ? toolbar.offsetHeight : 36
  const above = rect.top - height - GAP
  const flipped = above < HEADER_CLEARANCE
  const top = flipped ? rect.bottom + GAP : above
  const left = Math.max(EDGE_MARGIN, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - EDGE_MARGIN))
  return { pos: { top: Math.round(top), left: Math.round(left) }, flipped }
}

// Tracks the selection inside targetRef and returns where the formatting toolbar should float.
export function useSelectionToolbar(targetRef: RefObject<HTMLElement | null>, toolbarRef: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [flipped, setFlipped] = useState(false)
  const [active, setActive] = useState(NO_ACTIVE_FORMATS)

  useMountEffect(() => {
    const el = targetRef.current
    if (!el) return

    const update = () => {
      const sel = selectionInside(el)
      if (sel === null) {
        setVisible(false)
        return
      }
      setActive(readActiveFormats())
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        setVisible(false)
        return
      }
      const placement = placeToolbar(rect, toolbarRef.current)
      setPos(placement.pos)
      setFlipped(placement.flipped)
      setVisible(true)
    }
    // A drag selection finishes on mouseup, after the last selectionchange.
    const updateAfterMouseUp = () => setTimeout(update, 0)

    document.addEventListener('selectionchange', update)
    document.addEventListener('mouseup', updateAfterMouseUp)
    document.addEventListener('keyup', update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    update()
    return () => {
      document.removeEventListener('selectionchange', update)
      document.removeEventListener('mouseup', updateAfterMouseUp)
      document.removeEventListener('keyup', update)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  })

  return { visible, pos, flipped, active }
}
