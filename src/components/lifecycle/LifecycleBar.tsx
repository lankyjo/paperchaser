import { useState } from 'react'
import { canVoid } from '../../document/credits'
import { DOC_TYPES } from '../../document/docTypes'
import { canUnsend, isNumberedType } from '../../document/finalize'
import { preFinalizeWarnings } from '../../document/finalizeChecks'
import { getPlainText } from '../../document/richtext'
import type { DocumentModel } from '../../document/types'
import { sendBlockedReason } from '../../project/lifecycle'
import type { Project } from '../../project/project'
import type { SharedData } from '../../project/sharedData'
import { Button } from '../ui/button'
import { CopyEmailButton } from './CopyEmailButton'
import { FinalizeDialog } from './FinalizeDialog'
import { NextMonthButton } from './NextMonthButton'
import { QuoteActions } from './QuoteActions'
import { useDocumentLifecycle } from './useDocumentLifecycle'
import { VoidButton } from './VoidButton'

export interface LifecycleBarProps {
  model: DocumentModel
  shared: SharedData | undefined
  project?: Project
  history: { replace: (next: DocumentModel) => void; getRev: () => number }
}

// Top-bar actions. Draft: finalize and print. Sent: print again, copy the email, return to draft or void.
export function LifecycleBar({ model, shared, project, history }: LifecycleBarProps) {
  const [confirming, setConfirming] = useState(false)
  const lifecycle = useDocumentLifecycle(model, history, shared, project)
  const blocked = project ? sendBlockedReason(project, model.type) : null
  const capabilities = DOC_TYPES[model.type]
  const number = getPlainText(model.number)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm print:hidden">
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
            {model.status === 'sent' && <CopyEmailButton doc={model} />}
            {canUnsend(model) && (
              <Button size="sm" variant="ghost" onClick={() => void lifecycle.unsend()}>
                Back to draft
              </Button>
            )}
            {capabilities.voidable && canVoid(model) && <VoidButton onVoid={() => void lifecycle.voidDocument()} />}
            {capabilities.acceptable && <QuoteActions quote={model} project={project} save={lifecycle.save} />}
          </>
        )}
        {capabilities.recurring && <NextMonthButton doc={model} />}
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
    </>
  )
}
