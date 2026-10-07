import { useState } from 'react'
import { preferencesRepo } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'

const seenKey = (type: DocumentModel['type']) => `explainerSeen:${type}`

// Opens the step guide the first time a document type is opened, then remembers it was seen so it starts collapsed.
export function useExplainer(type: DocumentModel['type']) {
  const [open, setOpen] = useState<boolean | null>(null)

  useMountEffect(() => {
    void preferencesRepo.get<boolean>(seenKey(type)).then((seen) => {
      setOpen(seen !== true)
      if (seen !== true) void preferencesRepo.put(seenKey(type), true)
    })
  })

  return { open: open === true, ready: open !== null, show: () => setOpen(true), hide: () => setOpen(false) }
}
