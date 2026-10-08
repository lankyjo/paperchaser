import { DOC_TYPES } from '../../document/docTypes'
import { pullLatestChanges } from '../../project/sharedData'
import { PaymentsPanel } from '../payments/PaymentsPanel'
import { Button } from '../ui/button'
import type { LifecycleBarProps } from './LifecycleBar'
import { useDocumentLifecycle } from './useDocumentLifecycle'

// Shown under the top bar only when relevant: project data that changed since sending, and an invoice's payments.
export function LifecycleNotices({ model, shared, project, history }: LifecycleBarProps) {
  const lifecycle = useDocumentLifecycle(model, history, shared, project)
  const changes = shared && model.status === 'draft' && model.frozen ? pullLatestChanges(model, shared) : []
  const capabilities = DOC_TYPES[model.type]
  return (
    <div className="px-4 empty:hidden print:hidden">
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
      {capabilities.payable && model.status === 'sent' && (
        <PaymentsPanel invoice={model} onSave={(payments) => void lifecycle.savePayments(payments)} />
      )}
    </div>
  )
}
