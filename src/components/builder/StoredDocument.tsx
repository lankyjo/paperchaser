import { useState } from 'react'
import { loadDocumentForEditing, type LoadedDocument } from './loadDocumentForEditing'
import { useMountEffect } from '../../hooks/useMountEffect'
import { BuilderWorkspace } from './BuilderWorkspace'

// Loads a stored document with its project's shared data applied, then opens it in the builder.
export function StoredDocument({ documentId }: { documentId: string }) {
  const [loaded, setLoaded] = useState<LoadedDocument | null | undefined>(undefined)

  useMountEffect(() => {
    void loadDocumentForEditing(documentId).then(setLoaded)
  })

  if (loaded === undefined) return <div className="flex min-h-screen items-center justify-center" />
  if (loaded === null) return <p className="p-6 text-sm">Document not found.</p>
  return (
    <>
      {loaded.scheduleMismatch && (
        <p role="alert" className="mx-4 mt-2 rounded border border-destructive px-3 py-2 text-sm text-destructive print:hidden">
          This invoice no longer matches the agreement's payment schedule. Issue a credit note or a new invoice for the difference.
        </p>
      )}
      <BuilderWorkspace model={loaded.model} shared={loaded.shared} project={loaded.project} editable={!loaded.project?.archived} showExplainer />
    </>
  )
}
