import { referencedAssetIds } from '../document/assets'
import { BACKUP_VERSION, copyProjectBundle, countersAfterImport, type ProjectBundle, type WorkspaceBundle } from '../project/backup'
import type { Client } from '../project/client'
import { NUMBERED_TYPES, type Counter } from '../document/finalize'
import { sha256Hex } from '../lib/sha256Hex'
import { db } from './db'
import { assetsRepo, clientsRepo, companyRepo, countersRepo, documentsRepo, projectsRepo } from './repos'

export type ImportMode = 'replace' | 'skip' | 'copy'

async function assetsFor(documents: Parameters<typeof referencedAssetIds>[0]) {
  const ids = [...referencedAssetIds(documents)]
  return (await Promise.all(ids.map((id) => assetsRepo.get(id)))).filter((a) => a !== undefined)
}

export async function exportProject(projectId: string): Promise<ProjectBundle> {
  const project = await projectsRepo.get(projectId)
  if (!project) throw new Error('Project not found')
  const documents = await documentsRepo.byProject(projectId)
  const client = project.clientId === undefined ? undefined : await clientsRepo.get(project.clientId)
  return { format: 'paperchaser-project', version: BACKUP_VERSION, project, client, documents, assets: await assetsFor(documents) }
}

// Reuses a client already here (same id, or same name and email) instead of adding a duplicate.
async function resolveClient(client: Client | undefined): Promise<string | undefined> {
  if (!client) return undefined
  if (await clientsRepo.get(client.id)) return client.id
  const match = (await clientsRepo.list()).find((c) => c.name === client.name && c.email === client.email)
  if (match) return match.id
  await clientsRepo.put(client)
  return client.id
}

// A project file may only write its own documents: none may claim another project or reuse a document id owned elsewhere.
async function assertOwnDocuments(bundle: ProjectBundle) {
  if (bundle.documents.some((d) => d.projectId !== bundle.project.id)) throw new Error('This project file contains documents from another project.')
  const existing = await Promise.all(bundle.documents.map((d) => documentsRepo.get(d.id)))
  if (existing.some((d) => d !== undefined && d.projectId !== bundle.project.id)) throw new Error('This project file reuses documents that belong to another project.')
}

// Keeps only images whose id is the hash of their content and that are not already stored, so a file can never swap an existing logo or signature.
async function verifiedNewAssets(assets: ProjectBundle['assets']) {
  const checked = await Promise.all(assets.map(async (a) => ((await sha256Hex(a.dataUrl)) === a.id && !(await assetsRepo.get(a.id)) ? a : null)))
  return checked.filter((a) => a !== null)
}

// Adds a project file; when its id already exists the user chose to replace it, skip it or import a copy.
export async function importProject(incoming: ProjectBundle, mode: ImportMode): Promise<void> {
  const exists = (await projectsRepo.get(incoming.project.id)) !== undefined
  if (exists && mode === 'skip') return
  const bundle = exists && mode === 'copy' ? copyProjectBundle(incoming, () => crypto.randomUUID()) : incoming
  await assertOwnDocuments(bundle)
  if (exists && mode === 'replace') await projectsRepo.delete(bundle.project.id)
  const clientId = await resolveClient(bundle.client)
  await projectsRepo.put({ ...bundle.project, clientId: clientId ?? bundle.project.clientId })
  await db.table('documents').bulkPut(bundle.documents)
  await db.table('assets').bulkPut(await verifiedNewAssets(bundle.assets))
  const local = await Promise.all(NUMBERED_TYPES.map((t) => countersRepo.get(t)))
  await Promise.all(countersAfterImport(local, bundle.documents).map((c) => countersRepo.put(c)))
}

export async function exportWorkspace(): Promise<WorkspaceBundle> {
  const documents = await documentsRepo.list()
  const company = await companyRepo.get()
  return {
    format: 'paperchaser-workspace',
    version: BACKUP_VERSION,
    projects: await projectsRepo.list(),
    clients: await clientsRepo.list(),
    documents,
    assets: await assetsFor([...documents, { company }]),
    counters: (await db.table('counters').toArray()) as Counter[],
    company,
  }
}

const TABLES = ['projects', 'clients', 'documents', 'assets', 'counters', 'company']

// Restores a full backup in one transaction, replacing everything currently stored, then drops images nothing uses.
export async function replaceWorkspace(bundle: WorkspaceBundle): Promise<void> {
  await db.transaction('rw', TABLES, async () => {
    for (const table of TABLES) await db.table(table).clear()
    await db.table('projects').bulkAdd(bundle.projects)
    await db.table('clients').bulkAdd(bundle.clients)
    await db.table('documents').bulkAdd(bundle.documents)
    await db.table('assets').bulkAdd(bundle.assets)
    await db.table('counters').bulkAdd(bundle.counters)
    if (bundle.company) await companyRepo.put(bundle.company)
  })
  await assetsRepo.pruneUnreferenced()
}
