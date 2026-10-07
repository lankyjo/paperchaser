import { useState } from 'react'
import { applyAiOperations, changedSections } from '../../ai/aiPatch'
import { buildAiPrompt } from '../../ai/aiPrompt'
import { DEFAULT_AI_SETTINGS, type AiSettings } from '../../ai/aiSettings'
import { preferencesRepo } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { AI_SETTINGS_KEY } from '../settings/useAiSettings'

type Suggestion = { summary: string; changes: string[]; doc: DocumentModel }
type State = { kind: 'idle' } | { kind: 'thinking' } | { kind: 'error'; message: string } | { kind: 'ready'; suggestion: Suggestion }

// Asks the configured AI for edits, validates them, and holds the suggestion until the user accepts or discards it.
export function useAiSuggestion(model: DocumentModel, commit: (next: DocumentModel) => void) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  const suggest = async (instruction: string) => {
    setState({ kind: 'thinking' })
    try {
      const settings = (await preferencesRepo.get<AiSettings>(AI_SETTINGS_KEY)) ?? DEFAULT_AI_SETTINGS.openrouter
      const { system, user } = buildAiPrompt(model, instruction)
      // The AI SDK is large, so it loads only when a suggestion is first asked for.
      const { askAi } = await import('../../ai/aiProviders')
      const reply = await askAi(settings, system, user)
      const result = applyAiOperations(model, reply.operations)
      if (!result.ok) return setState({ kind: 'error', message: result.reason })
      setState({ kind: 'ready', suggestion: { summary: reply.summary, changes: changedSections(model, result.doc), doc: result.doc } })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'The AI request failed.' })
    }
  }

  const accept = () => {
    if (state.kind === 'ready') commit(state.suggestion.doc)
    setState({ kind: 'idle' })
  }
  return { state, suggest, accept, discard: () => setState({ kind: 'idle' }) }
}
