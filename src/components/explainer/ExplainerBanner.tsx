import { DOC_TITLES } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { Button } from '../ui/button'
import { ExplainerContent } from './ExplainerContent'
import { useExplainer } from './useExplainer'

// Beginner guide for the open document's step: why it matters, what goes in, and a tip; never printed.
export function ExplainerBanner({ type }: { type: DocumentModel['type'] }) {
  const { open, ready, show, hide } = useExplainer(type)
  if (!ready) return null
  if (!open) {
    return (
      <div className="px-4 pt-2 print:hidden">
        <button type="button" className="text-xs text-muted-foreground underline" onClick={show}>
          About this step
        </button>
      </div>
    )
  }
  return (
    <aside aria-label={`About the ${DOC_TITLES[type]}`} className="mx-4 mt-2 rounded-lg border bg-card p-4 text-sm print:hidden">
      <ExplainerContent type={type} />
      <Button size="sm" className="mt-3" onClick={hide}>
        Got it
      </Button>
    </aside>
  )
}
