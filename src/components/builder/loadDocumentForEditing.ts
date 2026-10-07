import { clientsRepo, companyRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { findSchedule, priorScheduleInvoices, syncScheduledInvoice } from '../../document/schedule'
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
  const schedule = agreement && findSchedule(agreement)
  if (!schedule) return { doc, scheduleMismatch: false }
  const prior = priorScheduleInvoices(schedule, ref.rowId, await documentsRepo.byProject(doc.projectId), ref.agreementId)
  const { invoice, mismatch } = syncScheduledInvoice(doc, schedule, prior)
  return { doc: invoice, scheduleMismatch: mismatch }
}

// A stored document with its project's shared data and its payment schedule applied, ready for the editor.
export async function loadDocumentForEditing(documentId: string): Promise<LoadedDocument | null> {
  const stored = await documentsRepo.get(documentId)
  if (stored === undefined) return null
  const [project, company] = await Promise.all([projectsRepo.get(stored.projectId), companyRepo.get()])
  const client = project?.clientId === undefined ? undefined : await clientsRepo.get(project.clientId)
  const shared = sharedFromProject(client, project, company)
  const { doc, scheduleMismatch } = await syncWithSchedule(stored, shared)
  return { model: applySharedData(doc, shared), shared, scheduleMismatch, project }
}
