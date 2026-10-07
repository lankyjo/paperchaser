import { useState } from 'react'
import { quoteState } from '../../document/quotes'
import type { DocumentModel } from '../../document/types'
import type { Project } from '../../project/project'
import { Button } from '../ui/button'
import { useQuoteActions } from './useQuoteActions'

const STATE_LABELS = { draft: 'Draft', sent: 'Awaiting answer', accepted: 'Accepted', declined: 'Declined', expired: 'Expired', superseded: 'Superseded' } as const

interface QuoteActionsProps {
  quote: DocumentModel
  project: Project | undefined
  save: (next: DocumentModel) => Promise<void>
}

// The client's answer to a sent quote and the follow-ups it allows.
export function QuoteActions({ quote, project, save }: QuoteActionsProps) {
  const actions = useQuoteActions(quote, project, save)
  const [lost, setLost] = useState(project?.state === 'lost')
  const state = quoteState(quote, new Date().toLocaleDateString('en-CA'))
  return (
    <>
      <span className="rounded-full border px-2 py-0.5 text-xs">{STATE_LABELS[state]}</span>
      {(state === 'sent' || state === 'expired') && (
        <>
          <Button size="sm" onClick={() => void actions.accept()}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => void actions.decline()}>
            Decline
          </Button>
        </>
      )}
      {state !== 'superseded' && state !== 'accepted' && (
        <Button size="sm" variant="outline" onClick={() => void actions.revise()}>
          Revise
        </Button>
      )}
      {state === 'superseded' && (
        <Button size="sm" variant="link" onClick={() => void actions.openLatest()}>
          Open latest revision
        </Button>
      )}
      {state === 'declined' && project && !lost && (
        <Button size="sm" variant="ghost" onClick={() => void actions.markProjectLost().then(() => setLost(true))}>
          Mark project lost
        </Button>
      )}
    </>
  )
}
