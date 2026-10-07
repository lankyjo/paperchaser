import { useState } from 'react'
import { canVoid } from '../../document/credits'
import { isNumberedType } from '../../document/finalize'
import { preFinalizeWarnings } from '../../document/finalizeChecks'
import { getPlainText } from '../../document/richtext'
import type { DocumentModel } from '../../document/types'
import { sendBlockedReason } from '../../project/lifecycle'
import type { Project } from '../../project/project'
import { pullLatestChanges, type SharedData } from '../../project/sharedData'
import { PaymentsPanel } from '../payments/PaymentsPanel'
import { Button } from '../ui/button'
import { FinalizeDialog } from './FinalizeDialog'
import { NextMonthButton } from './NextMonthButton'
import { QuoteActions } from './QuoteActions'
import { useDocumentLifecycle } from './useDocumentLifecycle'
import { VoidButton } from './VoidButton'

interface LifecycleBarProps {
  model: DocumentModel
  shared: SharedData | undefined
  project?: Project
  history: { replace: (next: DocumentModel) => void; getRev: () => number }
}

// Draft: finalize and print. Sent: print again or return to draft. Unsent snapshot: pull the latest project data.
export function LifecycleBar({ model, shared, project, history }: LifecycleBarProps) {
  const [confirming, setConfirming] = useState(false)
  const lifecycle = useDocumentLifecycle(model, history, shared, project)
  const blocked = project ? sendBlockedReason(project, model.type) : null
  const changes = shared && model.status === 'draft' && model.frozen ? pullLatestChanges(model, shared) : []
  const number = getPlainText(model.number)
  // Once money is recorded the document stays sent; corrections go through a credit note.
  const canUnsend = (model.payments ?? []).length === 0 && model.outcome === undefined && model.supersededBy === undefined

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm print:hidden">
        {model.status === 'draft' ? (
          <>
            <Button size="sm" disabled={blocked !== null} onClick={() => setConfirming(true)}>
              Finalize and print
            </Button>
            {blocked && <span className="text-xs text-destructive">{blocked}</span>}
          </>
        ) : (
          <>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {model.status === 'void' ? 'Void' : 'Sent'}
              {number && ` · ${number}`}
            </span>
            <Button size="sm" variant="outline" onClick={lifecycle.print}>
              Print
            </Button>
            {canUnsend && model.status !== 'void' && (
              <Button size="sm" variant="ghost" onClick={() => void lifecycle.unsend()}>
                Back to draft
              </Button>
            )}
            {model.type === 'invoice' && canVoid(model) && <VoidButton onVoid={() => void lifecycle.voidDocument()} />}
            {model.type === 'quote' && <QuoteActions quote={model} project={project} save={lifecycle.save} />}
          </>
        )}
        {(model.type === 'invoice' || model.type === 'monthlyReport') && <NextMonthButton doc={model} />}
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
      {model.type === 'invoice' && model.status === 'sent' && (
        <PaymentsPanel invoice={model} onSave={(payments) => void lifecycle.savePayments(payments)} />
      )}
    </>
  )
}
