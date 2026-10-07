import { blockSummary } from '../document/blocks'
import { documentSchema, type DocumentModel } from '../document/types'
import { BLOCK_LABELS } from '../strings/blockLabels'

export interface AiOperation {
  op: 'replace' | 'add' | 'remove'
  path: string
  valueJson?: string
}

export type AiPatchResult = { ok: true; doc: DocumentModel } | { ok: false; reason: string }

// Lifecycle, identity and money-trail fields the AI must never touch.
const PROTECTED = new Set(['id', 'projectId', 'type', 'number', 'status', 'frozen', 'payments', 'rev', 'receiptFor', 'creditFor', 'scheduleRef', 'reminderFor', 'revisionOf', 'revisionBase', 'revision', 'supersededBy', 'overrides', 'currency'])

const IMAGE = /^(data:|asset:)/
const TOKEN = /^\[image:(\d+)\]$/

// Replaces every image string with a short token so no image data is sent to a model.
export function stripImages(doc: DocumentModel): { doc: DocumentModel; images: string[] } {
  const images: string[] = []
  const json = JSON.stringify(doc, (_key, value: unknown) => {
    if (typeof value === 'string' && IMAGE.test(value)) return `[image:${images.push(value) - 1}]`
    return value
  })
  return { doc: JSON.parse(json) as DocumentModel, images }
}

export function restoreImages(doc: DocumentModel, images: string[]): DocumentModel {
  const json = JSON.stringify(doc, (_key, value: unknown) => {
    const match = typeof value === 'string' ? TOKEN.exec(value) : null
    return match ? (images[Number(match[1])] ?? value) : value
  })
  return JSON.parse(json) as DocumentModel
}

const segments = (path: string) => path.split('/').slice(1).map((s) => s.replaceAll('~1', '/').replaceAll('~0', '~'))

// Applies one JSON-pointer operation to a plain JSON tree in place.
function applyOperation(root: Record<string, unknown>, { op, path, valueJson }: AiOperation) {
  const keys = segments(path)
  const last = keys.pop()
  if (last === undefined) throw new Error('empty path')
  const parent = keys.reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], root) as Record<string, unknown> | unknown[]
  if (parent === undefined || parent === null) throw new Error(`no such path ${path}`)
  const value = op === 'remove' ? undefined : (JSON.parse(valueJson ?? 'null') as unknown)
  if (Array.isArray(parent)) {
    const idx = last === '-' ? parent.length : Number(last)
    if (op === 'add') parent.splice(idx, 0, value)
    else if (op === 'remove') parent.splice(idx, 1)
    else parent[idx] = value
  } else if (op === 'remove') delete parent[last]
  else parent[last] = value
}

// Applies model-proposed edits to a copy of a draft; protected fields, invalid JSON and schema violations are refused.
export function applyAiOperations(doc: DocumentModel, operations: AiOperation[]): AiPatchResult {
  if (doc.status !== 'draft' || doc.frozen !== undefined) return { ok: false, reason: 'Sent documents cannot be changed by AI.' }
  const blocked = operations.map((o) => segments(o.path)[0]).find((field) => PROTECTED.has(field))
  if (blocked) return { ok: false, reason: `The suggestion tried to change ${blocked}, which AI may not edit.` }
  const copy = structuredClone(doc) as unknown as Record<string, unknown>
  try {
    operations.forEach((o) => applyOperation(copy, o))
  } catch {
    return { ok: false, reason: 'The suggestion did not fit this document.' }
  }
  const parsed = documentSchema.safeParse(restoreImages(copy as unknown as DocumentModel, stripImages(doc).images))
  return parsed.success ? { ok: true, doc: parsed.data } : { ok: false, reason: 'The suggestion would make the document invalid.' }
}

// Human-readable list of the blocks and fields a suggestion changes, for review before accepting.
export function changedSections(before: DocumentModel, after: DocumentModel): string[] {
  const changes: string[] = []
  const beforeBlocks = new Map((before.blocks ?? []).map((b) => [b.id, JSON.stringify(b)]))
  for (const block of after.blocks ?? []) {
    if (beforeBlocks.get(block.id) !== JSON.stringify(block)) changes.push(`${BLOCK_LABELS[block.type]}: ${blockSummary(block)}`.trim())
  }
  const removed = (before.blocks ?? []).filter((b) => !(after.blocks ?? []).some((a) => a.id === b.id))
  removed.forEach((b) => changes.push(`Removed ${BLOCK_LABELS[b.type].toLowerCase()}`))
  for (const field of ['customer', 'company', 'lineItems', 'issueDate', 'dueDate', 'validUntil'] as const) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) changes.push(field === 'lineItems' ? 'Line items' : field)
  }
  return changes
}
