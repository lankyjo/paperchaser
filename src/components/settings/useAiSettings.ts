import { useState } from 'react'
import { DEFAULT_AI_SETTINGS, type AiProvider, type AiSettings } from '../../ai/aiSettings'
import { finishOpenRouterLogin } from '../../ai/openRouterLogin'
import { keyStore } from '../../db/keyStore'
import { preferencesRepo } from '../../db/repos'
import { useMountEffect } from '../../hooks/useMountEffect'

export const AI_SETTINGS_KEY = 'aiSettings'

// Provider, model and endpoint (stored with preferences) and whether a key is present (kept in the key store).
export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [hasKey, setHasKey] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refreshKey = async (provider: AiProvider) => setHasKey(provider === 'local' || (await keyStore.get(provider)) !== undefined)

  useMountEffect(() => {
    void (async () => {
      const stored = (await preferencesRepo.get<AiSettings>(AI_SETTINGS_KEY)) ?? DEFAULT_AI_SETTINGS.openrouter
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        await finishOpenRouterLogin(code).then(
          () => setMessage('OpenRouter connected.'),
          (err: Error) => setMessage(err.message),
        )
        window.history.replaceState(null, '', window.location.pathname)
      }
      await refreshKey(stored.provider)
      // Shown only once stored values are in, so an early pick is never overwritten by the load.
      setSettings(stored)
    })()
  })

  const save = async (next: AiSettings) => {
    setSettings(next)
    await preferencesRepo.put(AI_SETTINGS_KEY, next)
    await refreshKey(next.provider)
  }
  const saveKey = async (key: string, remember: boolean) => {
    if (!settings || settings.provider === 'local') return
    await keyStore.set(settings.provider, key, { remember })
    await refreshKey(settings.provider)
    setMessage(remember ? 'Key saved on this device.' : 'Key kept for this session only.')
  }
  const forgetKey = async () => {
    if (!settings) return
    if (settings.provider !== 'local') await keyStore.clear(settings.provider)
    await refreshKey(settings.provider)
  }
  return { settings, save, hasKey, saveKey, forgetKey, message }
}
