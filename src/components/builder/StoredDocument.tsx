import { useState } from 'react'
import { documentsRepo } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { BuilderWorkspace } from './BuilderWorkspace'

// Loads a stored document by id and opens it in the builder; edits autosave through the builder history.
export function StoredDocument({ documentId }: { documentId: string }) {
  const [model, setModel] = useState<DocumentModel | null | undefined>(undefined)

  useMountEffect(() => {
    void documentsRepo.get(documentId).then((doc) => setModel(doc ?? null))
  })

  if (model === undefined) return <div className="flex min-h-screen items-center justify-center" />
  if (model === null) return <p className="p-6 text-sm">Document not found.</p>
  return <BuilderWorkspace model={model} />
}
