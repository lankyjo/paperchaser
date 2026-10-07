import { useState } from 'react'
import { DEFAULT_AI_SETTINGS, type AiProvider } from '../../ai/aiSettings'
import { startOpenRouterLogin } from '../../ai/openRouterLogin'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useAiSettings } from './useAiSettings'

const PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: 'openrouter', label: 'OpenRouter (sign in, many models)' },
  { value: 'local', label: 'Local model (Ollama, LM Studio)' },
]

// Optional AI: choose a provider and model; keys stay in a separate store that backups never include.
export function AiSettingsSection() {
  const { settings, save, hasKey, saveKey, forgetKey, message } = useAiSettings()
  const [key, setKey] = useState('')
  const [remember, setRemember] = useState(false)
  if (settings === null) return null
  return (
    <section aria-label="AI assistant" className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm">
      <h2 className="font-medium">AI assistant (optional)</h2>
      <p className="text-muted-foreground">
        AI sends the document you are editing to the provider you choose. A local model keeps everything on this computer.
      </p>
      <div className="grid gap-1">
        <Label htmlFor="ai-provider">Provider</Label>
        <select id="ai-provider" className="h-8 rounded-md border bg-transparent px-2" value={settings.provider} onChange={(e) => void save(DEFAULT_AI_SETTINGS[e.target.value as AiProvider])}>
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="ai-model">Model</Label>
        <Input id="ai-model" value={settings.model} onChange={(e) => void save({ ...settings, model: e.target.value })} />
      </div>
      {settings.provider === 'local' && (
        <div className="grid gap-1">
          <Label htmlFor="ai-url">Local server address</Label>
          <Input id="ai-url" value={settings.baseUrl} onChange={(e) => void save({ ...settings, baseUrl: e.target.value })} />
        </div>
      )}
      {settings.provider === 'openrouter' && !hasKey && (
        <Button className="self-start" onClick={() => void startOpenRouterLogin()}>
          Connect with OpenRouter
        </Button>
      )}
      {settings.provider !== 'local' && !hasKey && (
        <div className="flex flex-wrap items-center gap-2">
          <Input aria-label="API key" type="password" className="w-72" placeholder="Or paste an OpenRouter key" value={key} onChange={(e) => setKey(e.target.value)} />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember on this device
          </label>
          <Button size="sm" disabled={key.trim() === ''} onClick={() => void saveKey(key.trim(), remember).then(() => setKey(''))}>
            Save key
          </Button>
        </div>
      )}
      {settings.provider !== 'local' && hasKey && (
        <div className="flex items-center gap-2">
          <span>Key connected.</span>
          <Button size="sm" variant="outline" onClick={() => void forgetKey()}>
            Forget key
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Tip: create a key with a spending limit just for Paperchaser.</p>
      {message && <p role="status">{message}</p>}
    </section>
  )
}
