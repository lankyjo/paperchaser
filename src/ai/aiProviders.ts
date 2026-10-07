import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, Output } from 'ai'
import { keyStore } from '../db/keyStore'
import { replySchema, type AiReply } from './aiPrompt'
import type { AiSettings } from './aiSettings'

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
