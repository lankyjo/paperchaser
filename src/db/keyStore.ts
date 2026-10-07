import Dexie, { type Table } from 'dexie'

export type KeyProvider = 'openrouter' | 'anthropic' | 'openai'

// A separate database for API keys, so workspace backups and exports can never include them.
class SecretsDb extends Dexie {
  keys!: Table<{ provider: KeyProvider; key: string }, KeyProvider>
  constructor() {
    super('paperchaser-secrets')
    this.version(1).stores({ keys: 'provider' })
  }
}

const secrets = new SecretsDb()
const sessionKeys = new Map<KeyProvider, string>()

// Remembered keys persist in the secrets database; session-only keys live in memory until the tab closes.
export const keyStore = {
  set: async (provider: KeyProvider, key: string, { remember }: { remember: boolean }) => {
    await keyStore.clear(provider)
    if (remember) await secrets.keys.put({ provider, key })
    else sessionKeys.set(provider, key)
  },
  get: async (provider: KeyProvider): Promise<string | undefined> => sessionKeys.get(provider) ?? (await keyStore.storedKey(provider)),
  storedKey: async (provider: KeyProvider) => (await secrets.keys.get(provider))?.key,
  clear: async (provider: KeyProvider) => {
    sessionKeys.delete(provider)
    await secrets.keys.delete(provider)
  },
}
