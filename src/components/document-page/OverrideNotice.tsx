import type { DocumentModel } from '../../document/types'
import { resetOverride, type SharedField } from '../../project/sharedData'
import { useProjectData } from '../builder/projectDataContext'

const LABELS: Record<SharedField, string> = { 'customer.name': 'client name', 'customer.address': 'client address' }

// Marks bill-to fields edited away from the project client, with a reset back to the project value; never printed.
export function OverrideNotice({ model, onCommit }: { model: DocumentModel; onCommit?: (next: DocumentModel) => void }) {
  const shared = useProjectData()
  const overrides = model.overrides ?? []
  if (shared === undefined || overrides.length === 0 || onCommit === undefined) return null
  return (
    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground print:hidden">
      {overrides.map((field) => (
        <button key={field} type="button" className="underline" onClick={() => onCommit(resetOverride(model, field, shared))}>
          Reset {LABELS[field]} to project
        </button>
      ))}
    </div>
  )
}
