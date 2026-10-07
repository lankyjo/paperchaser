import { useState } from 'react'
import { isNumberedType } from '../../document/finalize'
import { preFinalizeWarnings } from '../../document/finalizeChecks'
import { getPlainText } from '../../document/richtext'
import type { DocumentModel } from '../../document/types'
import { pullLatestChanges, type SharedData } from '../../project/sharedData'
import { Button } from '../ui/button'
import { FinalizeDialog } from './FinalizeDialog'
import { useDocumentLifecycle } from './useDocumentLifecycle'

interface LifecycleBarProps {
  model: DocumentModel
  shared: SharedData | undefined
  history: { replace: (next: DocumentModel) => void; getRev: () => number }
}

// Draft: finalize and print. Sent: print again or return to draft. Unsent snapshot: pull the latest project data.
export function LifecycleBar({ model, shared, history }: LifecycleBarProps) {
  const [confirming, setConfirming] = useState(false)
  const lifecycle = useDocumentLifecycle(model, history, shared)
  const changes = shared && model.status === 'draft' && model.frozen ? pullLatestChanges(model, shared) : []
  const number = getPlainText(model.number)

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm print:hidden">
      {model.status === 'draft' ? (
        <Button size="sm" onClick={() => setConfirming(true)}>
          Finalize and print
        </Button>
      ) : (
        <>
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Sent{number && ` · ${number}`}</span>
          <Button size="sm" variant="outline" onClick={lifecycle.print}>
            Print
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void lifecycle.unsend()}>
            Back to draft
          </Button>
        </>
      )}
      {changes.length > 0 && lifecycle.pullLatest && (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded border px-2 py-1">
          <span>Project data changed since this was sent:</span>
          {changes.map((c) => (
            <span key={c.field} className="text-muted-foreground">
              {c.field}: {c.from || '—'} → {c.to || '—'}
            </span>
          ))}
          <Button size="sm" variant="outline" onClick={() => void lifecycle.pullLatest?.()}>
            Pull latest
          </Button>
        </div>
      )}
      <FinalizeDialog
        open={confirming}
        warnings={confirming ? preFinalizeWarnings(model) : []}
        numbered={isNumberedType(model.type)}
        onOpenChange={setConfirming}
        onConfirm={() => {
          setConfirming(false)
          void lifecycle.finalizeAndPrint()
        }}
      />
    </div>
  )
}
