import { DOC_TITLES } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { EXPLAINERS } from '../../strings/explainers'

// Why a pipeline step matters, what goes in it, and a tip.
export function ExplainerContent({ type }: { type: DocumentModel['type'] }) {
  const explainer = EXPLAINERS[type]
  return (
    <>
      <h2 className="font-medium">{DOC_TITLES[type]}: {explainer.short}</h2>
      <p className="mt-2 text-muted-foreground">{explainer.why}</p>
      <p className="mt-2 font-medium">What goes in it</p>
      <ul className="ml-5 list-disc text-muted-foreground">
        {explainer.what.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2 text-muted-foreground">Tip: {explainer.tip}</p>
    </>
  )
}
