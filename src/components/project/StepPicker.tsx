import type { DocumentModel } from '../../document/types'
import { PIPELINE_STEPS, projectProgress, stepStatus, type StepType } from '../../project/pipeline'
import { StepCard } from './StepCard'

interface StepPickerProps {
  documents: DocumentModel[]
  doneSteps: string[]
  onCreate: (type: StepType) => void
  onToggleDone: (type: StepType) => void
}

// The ten pipeline steps in order, openable in any order, with overall progress.
export function StepPicker({ documents, doneSteps, onCreate, onToggleDone }: StepPickerProps) {
  const progress = projectProgress(documents, doneSteps)
  return (
    <section className="@container flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Pipeline</h2>
        <span className="text-sm text-muted-foreground">
          {progress.done}/{progress.total} done
        </span>
      </div>
      <ol className="grid gap-3 @md:grid-cols-2">
        {PIPELINE_STEPS.map(({ type, multi }) => (
          <StepCard
            key={type}
            type={type}
            multi={multi}
            status={stepStatus(type, documents, doneSteps)}
            documents={documents.filter((d) => d.type === type)}
            onCreate={() => onCreate(type)}
            onToggleDone={() => onToggleDone(type)}
          />
        ))}
      </ol>
    </section>
  )
}
