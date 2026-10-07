import { blockSummary } from '../document/blocks'
import { isLiveDraft } from '../document/finalize'
import { documentSchema, type DocumentModel } from '../document/types'
import { BLOCK_LABELS } from '../strings/blockLabels'

interface AiOperation {
  op: 'replace' | 'add' | 'remove'
  path: string
  valueJson?: string
}

type AiPatchResult = { ok: true; doc: DocumentModel } | { ok: false; reason: string }

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

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype'])

// Steps one level down, refusing prototype keys and anything that is not the node's own property.
function child(node: unknown, key: string): unknown {
  if (FORBIDDEN.has(key) || node === null || typeof node !== 'object' || !Object.hasOwn(node, key)) throw new Error(`no such path segment ${key}`)
  return (node as Record<string, unknown>)[key]
}

// A JSON-pointer array index: digits within bounds, or "-" (append) for add.
function arrayIndex(list: unknown[], key: string, op: AiOperation['op']): number {
  if (key === '-' && op === 'add') return list.length
  if (!/^\d+$/.test(key)) throw new Error(`bad index ${key}`)
  const idx = Number(key)
  if (idx > list.length || (op !== 'add' && idx === list.length)) throw new Error(`index out of range ${key}`)
  return idx
}

// Applies one JSON-pointer operation to a plain JSON tree in place.
function applyOperation(root: Record<string, unknown>, { op, path, valueJson }: AiOperation) {
  const keys = segments(path)
  const last = keys.pop()
  if (last === undefined || FORBIDDEN.has(last)) throw new Error('bad path')
  const parent = keys.reduce<unknown>(child, root)
  const value = op === 'remove' ? undefined : (JSON.parse(valueJson ?? 'null') as unknown)
  if (Array.isArray(parent)) {
    const idx = arrayIndex(parent, last, op)
    if (op === 'add') parent.splice(idx, 0, value)
    else if (op === 'remove') parent.splice(idx, 1)
    else parent[idx] = value
    return
  }
  if (parent === null || typeof parent !== 'object') throw new Error(`no such path ${path}`)
  const record = parent as Record<string, unknown>
  if (op !== 'add' && !Object.hasOwn(record, last)) throw new Error(`no such field ${last}`)
  if (op === 'remove') delete record[last]
  else record[last] = value
}

// Applies model-proposed edits to a copy of a draft; protected fields, invalid JSON and schema violations are refused.
export function applyAiOperations(doc: DocumentModel, operations: AiOperation[]): AiPatchResult {
  if (!isLiveDraft(doc)) return { ok: false, reason: 'Sent documents cannot be changed by AI.' }
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
