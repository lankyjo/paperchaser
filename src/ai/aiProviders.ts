import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, Output } from 'ai'
import { keyStore } from '../db/keyStore'
import { replySchema, type AiReply } from './aiPrompt'

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

async function languageModel(settings: AiSettings) {
  if (settings.provider === 'local') return createOpenAICompatible({ name: 'local', baseURL: settings.baseUrl }).chatModel(settings.model)
  const apiKey = await keyStore.get('openrouter')
  if (!apiKey) throw new Error('Connect OpenRouter in Settings first.')
  return createOpenRouter({ apiKey }).chat(settings.model)
}

// Asks the chosen model for edits as structured output; the SDK validates the reply against the schema.
export async function askAi(settings: AiSettings, system: string, prompt: string): Promise<AiReply> {
  const { output } = await generateText({ model: await languageModel(settings), system, prompt, output: Output.object({ schema: replySchema }) })
  return output
}
