import { useCallback, useState } from 'react'

// Tracks which [data-step] child sits in the middle band of the screen; attach the ref to their parent.
export function useActiveStep() {
  const [active, setActive] = useState(0)
  const stepsRef = useCallback((parent: HTMLElement | null) => {
    if (!parent) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.step))),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    parent.querySelectorAll('[data-step]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return { active, stepsRef }
}
