import { useState } from 'react'
import type { DocumentModel } from '../../document/types'
import { BottomSheet } from '../BottomSheet'
import { ExplainerSheet } from '../explainer/ExplainerSheet'
import { ProjectSteps } from '../project/ProjectSteps'
import { PropertiesPane, type PropertiesPaneProps } from '../PropertiesPane'
import { Button } from '../ui/button'

type Sheet = 'steps' | 'properties' | null

// Mobile buttons for the pipeline, document settings and step guide, each opening a bottom sheet.
export function MobileSheets({ model, propertiesProps, showExplainer }: { model: DocumentModel; propertiesProps: Omit<PropertiesPaneProps, 'selectedItemId'>; showExplainer: boolean }) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const close = (open: boolean) => !open && setSheet(null)
  return (
    <div className="flex gap-2 overflow-x-auto border-b px-3 py-2 lg:hidden print:hidden">
      <Button size="sm" variant="outline" onClick={() => setSheet('steps')}>
        Pipeline
      </Button>
      <Button size="sm" variant="outline" onClick={() => setSheet('properties')}>
        Document settings
      </Button>
      {showExplainer && <ExplainerSheet type={model.type} />}
      <BottomSheet open={sheet === 'steps'} onOpenChange={close} title="Pipeline">
        <ProjectSteps projectId={model.projectId} />
      </BottomSheet>
      <BottomSheet open={sheet === 'properties'} onOpenChange={close} title="Document settings">
        <PropertiesPane {...propertiesProps} selectedItemId={null} />
      </BottomSheet>
    </div>
  )
}
