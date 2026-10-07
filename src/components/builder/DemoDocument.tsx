import { useState } from 'react'
import { DEMO_DOCUMENT_ID, documentsRepo } from '../../db/repos'
import type { DocumentModel, PageSize } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { BuilderWorkspace } from './BuilderWorkspace'

// Seeds the demo document on first run, loads it, then opens it in the builder.
export function DemoDocument({ pageSize }: { pageSize?: PageSize }) {
  const [model, setModel] = useState<DocumentModel | null>(null)

  useMountEffect(() => {
    void (async () => {
      await documentsRepo.seedDemoIfEmpty()
      setModel((await documentsRepo.get(DEMO_DOCUMENT_ID)) ?? null)
    })()
  })

  if (model === null) return <div className="flex min-h-screen items-center justify-center" />
  return <BuilderWorkspace model={model} pageSize={pageSize} />
}
