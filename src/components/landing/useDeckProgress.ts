import { useCallback, useState } from 'react'

// Maps scroll through the pinned deck to --p (0 to last sheet) on the deck, and the nearest sheet index.
export function useDeckProgress(count: number) {
  const [index, setIndex] = useState(0)
  const deckRef = useCallback(
    (deck: HTMLElement | null) => {
      if (!deck) return
      let frame = 0
      const update = () => {
        frame = 0
        const rect = deck.getBoundingClientRect()
        const travel = rect.height - innerHeight
        if (travel <= 0) return
        const p = Math.min(1, Math.max(0, -rect.top / travel)) * (count - 1)
        deck.style.setProperty('--p', p.toFixed(3))
        setIndex(Math.round(p))
      }
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update)
      }
      update()
      addEventListener('scroll', schedule, { passive: true })
      addEventListener('resize', schedule)
      return () => {
        cancelAnimationFrame(frame)
        removeEventListener('scroll', schedule)
        removeEventListener('resize', schedule)
      }
    },
    [count],
  )
  return { index, deckRef }
}
