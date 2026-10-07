export type AiProvider = 'openrouter' | 'local'

export interface AiSettings {
  provider: AiProvider
  model: string
  baseUrl: string
}

// OpenRouter reaches every major model with one key; a local server (Ollama, LM Studio) keeps documents on this computer.
export const DEFAULT_AI_SETTINGS: Record<AiProvider, AiSettings> = {
  openrouter: { provider: 'openrouter', model: 'anthropic/claude-opus-5.5', baseUrl: '' },
  local: { provider: 'local', model: 'llama3.2', baseUrl: 'http://localhost:11434/v1' },
}
