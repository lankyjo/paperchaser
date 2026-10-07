import { useState } from 'react'
import type { DocumentModel } from '../../document/types'
import { Button } from '../ui/button'
import { useAiSuggestion } from './useAiSuggestion'

// Ask the AI for a change, review what it would edit, then accept (undoable) or discard; never printed.
export function AiPanel({ model, commit }: { model: DocumentModel; commit: (next: DocumentModel) => void }) {
  const [instruction, setInstruction] = useState('')
  const { state, suggest, accept, discard } = useAiSuggestion(model, commit)
  return (
    <section aria-label="AI assistant" className="mx-4 flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm print:hidden">
      <div className="flex gap-2">
        <textarea
          aria-label="Ask AI"
          placeholder="Ask AI, e.g. “Write a friendly intro for a coffee brand”"
          className="min-h-10 flex-1 rounded-md border bg-transparent px-2 py-1"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button size="sm" disabled={instruction.trim() === '' || state.kind === 'thinking'} onClick={() => void suggest(instruction)}>
          {state.kind === 'thinking' ? 'Thinking…' : 'Suggest'}
        </Button>
      </div>
      {state.kind === 'error' && <p role="alert" className="text-destructive">{state.message}</p>}
      {state.kind === 'ready' && (
        <div role="region" aria-label="AI suggestion" className="flex flex-col gap-1 rounded border p-2">
          <p className="font-medium">{state.suggestion.summary}</p>
          <ul className="ml-5 list-disc text-muted-foreground">
            {state.suggestion.changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button size="sm" onClick={accept}>
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={discard}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
