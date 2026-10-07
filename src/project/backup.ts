import * as z from 'zod'

import type { Counter } from '../document/finalize'
import { getPlainText } from '../document/richtext'
import { companySchema, documentSchema, type DocumentModel } from '../document/types'
import { clientSchema } from './client'
import { projectSchema } from './project'

export const BACKUP_VERSION = 1

const assetSchema = z.object({ id: z.string(), dataUrl: z.string().refine((v) => v.startsWith('data:image/')), width: z.int(), height: z.int() })
const counterSchema = z.object({ type: documentSchema.shape.type, prefix: z.string(), next: z.int().min(1), yearlyReset: z.boolean(), year: z.int().optional() })

const projectBundleSchema = z.object({
  format: z.literal('paperchaser-project'),
  version: z.int(),
  project: projectSchema,
  client: clientSchema.optional(),
  documents: z.array(documentSchema),
  assets: z.array(assetSchema),
})

export const workspaceBundleSchema = z.object({
  format: z.literal('paperchaser-workspace'),
  version: z.int(),
  projects: z.array(projectSchema),
  clients: z.array(clientSchema),
  documents: z.array(documentSchema),
  assets: z.array(assetSchema),
  counters: z.array(counterSchema),
  company: companySchema.optional(),
})

export type ProjectBundle = z.infer<typeof projectBundleSchema>
export type WorkspaceBundle = z.infer<typeof workspaceBundleSchema>
export type Bundle = ProjectBundle | WorkspaceBundle

type BundleParse = { ok: true; bundle: Bundle } | { ok: false; reason: string }

// ponytail: naive length cap rejects oversized files before JSON.parse; switch to streaming parsing if multi-megabyte backups matter.
export const MAX_BUNDLE_LENGTH = 5_000_000

// Untrusted import boundary: size, JSON syntax, then version, then the full schema; never throws.
export function parseBundle(json: string): BundleParse {
  if (json.length > MAX_BUNDLE_LENGTH) return { ok: false, reason: 'This file is too large to import.' }
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, reason: 'This file is not valid JSON.' }
  }
  const version = (raw as { version?: unknown } | null)?.version
  if (typeof version === 'number' && version > BACKUP_VERSION) return { ok: false, reason: 'This file was made by a newer version of Paperchaser.' }
  const parsed = z.discriminatedUnion('format', [projectBundleSchema, workspaceBundleSchema]).safeParse(raw)
  return parsed.success ? { ok: true, bundle: parsed.data } : { ok: false, reason: 'This is not a Paperchaser backup or project file.' }
}

// Fields on a document that point at another document in the same project.
const REFERENCE_FIELDS = ['creditFor', 'reminderFor', 'revisionOf', 'supersededBy'] as const

// A copy of a project with fresh ids; links between its documents follow the new ids, numbers stay as issued.
export function copyProjectBundle(bundle: ProjectBundle, newId: () => string): ProjectBundle {
  const projectId = newId()
  const ids = new Map(bundle.documents.map((d) => [d.id, newId()]))
  const remap = (id: string | undefined) => (id === undefined ? undefined : (ids.get(id) ?? id))
  const documents = bundle.documents.map((doc) => {
    const copy: DocumentModel = { ...doc, id: ids.get(doc.id)!, projectId, rev: undefined }
    for (const field of REFERENCE_FIELDS) if (doc[field] !== undefined) copy[field] = remap(doc[field])
    if (doc.receiptFor) copy.receiptFor = { ...doc.receiptFor, invoiceId: remap(doc.receiptFor.invoiceId)! }
    if (doc.scheduleRef) copy.scheduleRef = { ...doc.scheduleRef, agreementId: remap(doc.scheduleRef.agreementId)! }
    return copy
  })
  return { ...bundle, project: { ...bundle.project, id: projectId }, documents }
}

const trailingNumber = (number: string) => Number(/(\d+)$/.exec(number)?.[1] ?? 0)

// Counters move past the highest imported number of their type, so new documents never reuse an imported number.
export function countersAfterImport(local: Counter[], imported: DocumentModel[]): Counter[] {
  return local.map((counter) => {
    const highest = Math.max(0, ...imported.filter((d) => d.type === counter.type && d.revisionBase === undefined).map((d) => trailingNumber(getPlainText(d.number))))
    return { ...counter, next: Math.max(counter.next, highest + 1) }
  })
}
