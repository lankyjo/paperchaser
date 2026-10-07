import { useMemo, useState } from 'react'
import type { DocumentModel, PageSize, TemplateId } from '../../document/types'

// Measures the rendered document height without an effect: a ref callback reads offsetHeight after commit.
export function useMeasuredHeight(model: DocumentModel, pageSize: PageSize, template?: TemplateId) {
  const [measuredH, setMeasuredH] = useState(0)

  // Changing the key remounts the measured element, so the ref callback re-measures new content.
  const modelRevision = useMemo(() => JSON.stringify(model), [model])
  const measureKey = `${pageSize}-${template ?? 'minimal'}-${modelRevision}`

  // Writing only on change keeps the per-render ref callback from looping.
  const measureRef = (el: HTMLDivElement | null) => {
    const h = el?.offsetHeight ?? 0
    if (h !== measuredH) setMeasuredH(h)
  }

  return { measuredH, measureKey, measureRef }
}
