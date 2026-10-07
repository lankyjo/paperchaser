import { useState } from 'react'
import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { applySharedData, sharedFromClient, type SharedData } from '../../project/sharedData'
import { BuilderWorkspace } from './BuilderWorkspace'

interface Loaded {
  model: DocumentModel
  shared: SharedData
}

async function loadWithProjectData(documentId: string): Promise<Loaded | null> {
  const doc = await documentsRepo.get(documentId)
  if (doc === undefined) return null
  const project = await projectsRepo.get(doc.projectId)
  const client = project?.clientId === undefined ? undefined : await clientsRepo.get(project.clientId)
  const shared = sharedFromClient(client)
  return { model: applySharedData(doc, shared), shared }
}

// Loads a stored document with its project's shared data applied, then opens it in the builder.
export function StoredDocument({ documentId }: { documentId: string }) {
  const [loaded, setLoaded] = useState<Loaded | null | undefined>(undefined)

  useMountEffect(() => {
    void loadWithProjectData(documentId).then(setLoaded)
  })

  if (loaded === undefined) return <div className="flex min-h-screen items-center justify-center" />
  if (loaded === null) return <p className="p-6 text-sm">Document not found.</p>
  return <BuilderWorkspace model={loaded.model} shared={loaded.shared} />
}
