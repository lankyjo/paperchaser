import { DOC_TYPES } from '../document/docTypes'
import { isMoneyDocument } from '../document/documentBlocks'
import type { DocumentModel } from '../document/types'
import type { Project } from './project'

// A lead can only send quotes until a real client is added; other projects may send to a hand-typed customer.
export function sendBlockedReason(project: Pick<Project, 'state' | 'clientId'>, type: DocumentModel['type']): string | null {
  if (project.state !== 'lead' || DOC_TYPES[type].sendableByLead || project.clientId !== undefined) return null
  return 'Add a client to this project before sending anything other than a quote.'
}

// The first non-quote send turns a lead into an active project.
export function projectAfterSend(project: Project, type: DocumentModel['type']): Project {
  return project.state === 'lead' && !DOC_TYPES[type].sendableByLead ? { ...project, state: 'active' } : project
}

// Projects whose money documents have gone out are kept for the record; archive them instead.
export function canDeleteProject(documents: Pick<DocumentModel, 'type' | 'status'>[]): boolean {
  return !documents.some((d) => isMoneyDocument(d) && d.status !== 'draft')
}
