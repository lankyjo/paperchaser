import { DOC_TITLES } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { BottomSheet } from '../BottomSheet'
import { Button } from '../ui/button'
import { ExplainerContent } from './ExplainerContent'
import { useExplainer } from './useExplainer'

// Mobile step guide: opens by itself the first time, then from its button.
export function ExplainerSheet({ type }: { type: DocumentModel['type'] }) {
  const { open, ready, show, hide } = useExplainer(type)
  if (!ready) return null
  return (
    <>
      <Button size="sm" variant="outline" onClick={show}>
        About this step
      </Button>
      <BottomSheet open={open} onOpenChange={(next) => !next && hide()} title={`About the ${DOC_TITLES[type]}`}>
        <div className="text-sm">
          <ExplainerContent type={type} />
          <Button size="sm" className="mt-3" onClick={hide}>
            Got it
          </Button>
        </div>
      </BottomSheet>
    </>
  )
}
