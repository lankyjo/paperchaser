import { DOC_TITLES } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { EXPLAINERS } from '../../strings/explainers'
import { Button } from '../ui/button'
import { useExplainer } from './useExplainer'

// Beginner guide for the open document's step: why it matters, what goes in, and a tip; never printed.
export function ExplainerBanner({ type }: { type: DocumentModel['type'] }) {
  const { open, ready, show, hide } = useExplainer(type)
  const explainer = EXPLAINERS[type]
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
      <h2 className="font-medium">{DOC_TITLES[type]}: {explainer.short}</h2>
      <p className="mt-2 text-muted-foreground">{explainer.why}</p>
      <p className="mt-2 font-medium">What goes in it</p>
      <ul className="ml-5 list-disc text-muted-foreground">
        {explainer.what.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2 text-muted-foreground">Tip: {explainer.tip}</p>
      <Button size="sm" className="mt-3" onClick={hide}>
        Got it
      </Button>
    </aside>
  )
}
