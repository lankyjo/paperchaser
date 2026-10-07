import { useState } from 'react'
import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { isMoneyDocument } from '../../document/documentBlocks'
import { syncScheduledInvoice, type ScheduleBlock } from '../../document/schedule'
import { applySharedData, sharedFromProject, type SharedData } from '../../project/sharedData'
import { BlockWorkspace } from '../blocks/BlockWorkspace'
import { ExplainerBanner } from '../explainer/ExplainerBanner'
import { BuilderWorkspace } from './BuilderWorkspace'

interface Loaded {
  model: DocumentModel
  shared: SharedData
  scheduleMismatch: boolean
}

// An invoice billed from an agreement row follows the current schedule while a draft; a sent one is checked against it.
async function syncWithSchedule(doc: DocumentModel): Promise<{ doc: DocumentModel; scheduleMismatch: boolean }> {
  const ref = doc.scheduleRef
  if (ref === undefined) return { doc, scheduleMismatch: false }
  const agreement = await documentsRepo.get(ref.agreementId)
  const schedule = agreement?.blocks?.find((b): b is ScheduleBlock => b.type === 'paymentSchedule')
  if (!schedule) return { doc, scheduleMismatch: false }
  const siblings = (await documentsRepo.byProject(doc.projectId)).filter((d) => d.scheduleRef?.agreementId === ref.agreementId && d.status !== 'void')
  const earlier = schedule.rows.slice(0, schedule.rows.findIndex((r) => r.id === ref.rowId)).map((r) => r.id)
  const prior = earlier.map((rowId) => siblings.find((d) => d.scheduleRef?.rowId === rowId)).filter((d): d is DocumentModel => d !== undefined)
  const { invoice, mismatch } = syncScheduledInvoice(doc, schedule, prior)
  return { doc: invoice, scheduleMismatch: mismatch }
}

async function loadWithProjectData(documentId: string): Promise<Loaded | null> {
  const stored = await documentsRepo.get(documentId)
  if (stored === undefined) return null
  const { doc, scheduleMismatch } = await syncWithSchedule(stored)
  const project = await projectsRepo.get(doc.projectId)
  const client = project?.clientId === undefined ? undefined : await clientsRepo.get(project.clientId)
  const shared = sharedFromProject(client, project)
  return { model: applySharedData(doc, shared), shared, scheduleMismatch }
}

// Loads a stored document with its project's shared data applied, then opens it in the builder.
export function StoredDocument({ documentId }: { documentId: string }) {
  const [loaded, setLoaded] = useState<Loaded | null | undefined>(undefined)

  useMountEffect(() => {
    void loadWithProjectData(documentId).then(setLoaded)
  })

  if (loaded === undefined) return <div className="flex min-h-screen items-center justify-center" />
  if (loaded === null) return <p className="p-6 text-sm">Document not found.</p>
  return (
    <>
      <ExplainerBanner type={loaded.model.type} />
      {loaded.scheduleMismatch && (
        <p role="alert" className="mx-4 mt-2 rounded border border-destructive px-3 py-2 text-sm text-destructive print:hidden">
          This invoice no longer matches the agreement's payment schedule. Issue a credit note or a new invoice for the difference.
        </p>
      )}
      {isMoneyDocument(loaded.model) ? (
        <BuilderWorkspace model={loaded.model} shared={loaded.shared} />
      ) : (
        <BlockWorkspace model={loaded.model} shared={loaded.shared} />
      )}
    </>
  )
}
