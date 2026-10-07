// Must be imported before dexie: it installs the in-memory IndexedDB globals Dexie captures at load.
import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { finalizeDocument } from '../../document/finalize'
import { newInvoice } from '../../document/newInvoice'
import { createClient } from '../../project/client'
import { createProject } from '../../project/project'
import { exportProject, exportWorkspace, importProject, replaceWorkspace } from '../backupRepo'
import { db } from '../db'
import { clientsRepo, countersRepo, documentsRepo, projectsRepo } from '../repos'

const NOW = '2026-10-07T10:00:00.000Z'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await projectsRepo.put({ ...createProject({ id: 'p1', title: 'Acme', now: NOW }), clientId: 'c1' })
  await clientsRepo.put(createClient({ id: 'c1', name: 'Acme Coffee' }))
  await documentsRepo.put(finalizeDocument(newInvoice({ id: 'i1', projectId: 'p1', today: '2026-10-07' }), 'INV-0042', NOW))
})

describe('project export and import', () => {
  it('round-trips a project, and an id clash can be copied, replaced or skipped', async () => {
    const bundle = await exportProject('p1')
    expect(bundle.documents).toHaveLength(1)
    expect(bundle.client?.name).toBe('Acme Coffee')

    await importProject(bundle, 'copy')
    expect(await projectsRepo.list()).toHaveLength(2)
    expect(await clientsRepo.list()).toHaveLength(1)
    expect((await countersRepo.get('invoice')).next).toBe(43)

    await importProject({ ...bundle, project: { ...bundle.project, title: 'Replaced' } }, 'replace')
    expect((await projectsRepo.get('p1'))?.title).toBe('Replaced')
    await importProject({ ...bundle, project: { ...bundle.project, title: 'Skipped' } }, 'skip')
    expect((await projectsRepo.get('p1'))?.title).toBe('Replaced')
  })
})

describe('workspace backup', () => {
  it('replaces everything with the backup contents', async () => {
    const backup = await exportWorkspace()
    await projectsRepo.put(createProject({ id: 'extra', title: 'Extra', now: NOW }))
    await replaceWorkspace(backup)
    expect((await projectsRepo.list()).map((p) => p.id)).toEqual(['p1'])
    expect(await documentsRepo.get('i1')).toBeDefined()
  })
})
