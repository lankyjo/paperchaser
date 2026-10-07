import { useState } from 'react'
import { useMountEffect } from '../../hooks/useMountEffect'
import { NO_ACTIVE_FORMATS, readActiveFormats } from './readActiveFormats'

// Tracks whether a contentEditable cell has focus and which formats apply at its selection.
export function useFocusedCellFormats() {
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(NO_ACTIVE_FORMATS)

  useMountEffect(() => {
    const check = () => {
      const ae = document.activeElement as HTMLElement | null
      const isCell = ae !== null && ae.getAttribute('contenteditable') === 'true'
      setVisible(isCell)
      if (isCell) setActive(readActiveFormats())
    }
    // Focus has not moved to the next element yet during focusout.
    const checkAfterFocusOut = () => setTimeout(check, 0)

    document.addEventListener('focusin', check)
    document.addEventListener('focusout', checkAfterFocusOut)
    document.addEventListener('selectionchange', check)
    document.addEventListener('keyup', check)
    document.addEventListener('mouseup', check)
    check()
    return () => {
      document.removeEventListener('focusin', check)
      document.removeEventListener('focusout', checkAfterFocusOut)
      document.removeEventListener('selectionchange', check)
      document.removeEventListener('keyup', check)
      document.removeEventListener('mouseup', check)
    }
  })

  return { visible, active }
}
