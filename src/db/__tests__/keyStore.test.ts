// Must be imported before dexie: it installs the in-memory IndexedDB globals Dexie captures at load.
import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { exportWorkspace } from '../backupRepo'
import { keyStore } from '../keyStore'

beforeEach(async () => {
  await keyStore.clear('openrouter')
})

describe('keyStore', () => {
  it('keeps a remembered key in its own database that workspace backups never read', async () => {
    await keyStore.set('openrouter', 'sk-or-secret', { remember: true })
    expect(await keyStore.get('openrouter')).toBe('sk-or-secret')
    expect(JSON.stringify(await exportWorkspace())).not.toContain('sk-or-secret')
  })

  it('keeps a session-only key in memory and never writes it to storage', async () => {
    await keyStore.set('openrouter', 'sk-session', { remember: false })
    expect(await keyStore.get('openrouter')).toBe('sk-session')
    expect(await keyStore.storedKey('openrouter')).toBeUndefined()
  })
})
