import { useEffect } from 'react'

// Runs an effect once on mount; components use this instead of calling useEffect directly.
export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once by design
  useEffect(effect, [])
}
