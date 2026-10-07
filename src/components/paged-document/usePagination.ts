import { useCallback, useMemo, useState } from 'react'
import { PAGE_PADDING_PX } from '../../document/pageLayout'
import { paginate, type Pagination } from '../../document/pagination'
import { PAGE_SIZE_PX } from '../../document/tokens'
import type { PageSize } from '../../document/types'
import { measurePageItems } from './measurePageItems'

// Splits a measured DocumentPage into pages; re-measures when the content changes and whenever its size changes (fonts, images).
export function usePagination(pageSize: PageSize, content: unknown) {
  const [pagination, setPagination] = useState<Pagination | null>(null)
  // One px of slack absorbs sub-pixel rounding between the measured copy and the printed page.
  const space = PAGE_SIZE_PX[pageSize].height - 2 * PAGE_PADDING_PX - 1
  const revision = useMemo(() => JSON.stringify(content), [content])

  const measureRef = useCallback(
    (root: HTMLDivElement | null) => {
      if (!root) return
      const update = () => {
        // The copy is display:none while printing; keep the last pages instead of re-paginating zero heights.
        if (root.offsetHeight === 0) return
        const next = paginate(measurePageItems(root), space)
        setPagination((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      }
      update()
      const observer = new ResizeObserver(update)
      observer.observe(root)
      return () => observer.disconnect()
    },
    [space],
  )

  // Keying the measured copy by content remounts it on change, which re-measures; plain re-renders reuse the observer.
  return { measureRef, measureKey: revision, pagination }
}
