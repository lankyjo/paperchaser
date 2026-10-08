import { useEffect, useRef } from 'react'

// Calls `callback` each time `condition` turns true, including on mount.
export function useOnTrue(condition: boolean, callback: (() => void) | undefined) {
  const latest = useRef(callback)
  latest.current = callback
  useEffect(() => {
    if (condition) latest.current?.()
  }, [condition])
}
