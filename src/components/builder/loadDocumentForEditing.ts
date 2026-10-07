import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { syncScheduledInvoice, type ScheduleBlock } from '../../document/schedule'
import type { DocumentModel } from '../../document/types'
import type { Project } from '../../project/project'
import { applySharedData, sharedFromProject, type SharedData } from '../../project/sharedData'

export interface LoadedDocument {
  model: DocumentModel
  shared: SharedData
  scheduleMismatch: boolean
  project: Project | undefined
}

// An invoice billed from an agreement row follows the current schedule (with project data applied) while a draft; a sent one is checked against it.
async function syncWithSchedule(doc: DocumentModel, shared: SharedData): Promise<{ doc: DocumentModel; scheduleMismatch: boolean }> {
  const ref = doc.scheduleRef
  if (ref === undefined) return { doc, scheduleMismatch: false }
  const stored = await documentsRepo.get(ref.agreementId)
  const agreement = stored && applySharedData(stored, shared)
  const schedule = agreement?.blocks?.find((b): b is ScheduleBlock => b.type === 'paymentSchedule')
  if (!schedule) return { doc, scheduleMismatch: false }
  const siblings = (await documentsRepo.byProject(doc.projectId)).filter((d) => d.scheduleRef?.agreementId === ref.agreementId && d.status !== 'void')
  const earlier = schedule.rows.slice(0, schedule.rows.findIndex((r) => r.id === ref.rowId)).map((r) => r.id)
  const prior = earlier.map((rowId) => siblings.find((d) => d.scheduleRef?.rowId === rowId)).filter((d): d is DocumentModel => d !== undefined)
  const { invoice, mismatch } = syncScheduledInvoice(doc, schedule, prior)
  return { doc: invoice, scheduleMismatch: mismatch }
}

// A stored document with its project's shared data and its payment schedule applied, ready for the editor.
export async function loadDocumentForEditing(documentId: string): Promise<LoadedDocument | null> {
  const stored = await documentsRepo.get(documentId)
  if (stored === undefined) return null
  const project = await projectsRepo.get(stored.projectId)
  const client = project?.clientId === undefined ? undefined : await clientsRepo.get(project.clientId)
  const shared = sharedFromProject(client, project)
  const { doc, scheduleMismatch } = await syncWithSchedule(stored, shared)
  return { model: applySharedData(doc, shared), shared, scheduleMismatch, project }
}
