import { Link } from '@tanstack/react-router'
import { getPlainText } from '../../document/richtext'
import { DOC_TITLES } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import type { StepStatus, StepType } from '../../project/pipeline'
import { EXPLAINERS } from '../../strings/explainers'
import { Button } from '../ui/button'

const STATUS_LABELS: Record<StepStatus, string> = { notStarted: 'Not started', draft: 'Draft', sent: 'Sent', done: 'Done' }

interface StepCardProps {
  type: StepType
  multi: boolean
  status: StepStatus
  documents: DocumentModel[]
  onCreate: () => void
  onToggleDone: () => void
}

// One pipeline step: its status, its documents and the action to start (or add) one.
export function StepCard({ type, multi, status, documents, onCreate, onToggleDone }: StepCardProps) {
  const title = DOC_TITLES[type]
  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-card p-3" aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{STATUS_LABELS[status]}</span>
      </div>
      <p className="text-xs text-muted-foreground">{EXPLAINERS[type].short}</p>
      <ul className="flex flex-col gap-1 text-sm">
        {documents.map((doc, idx) => (
          <li key={doc.id}>
            <Link to="/documents/$documentId" params={{ documentId: doc.id }} className="underline">
              {getPlainText(doc.number) || `${title} ${multi ? idx + 1 : ''}`.trim()}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        {(multi || documents.length === 0) && (
          <Button size="sm" variant="outline" onClick={onCreate}>
            {documents.length === 0 ? `Start ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}
          </Button>
        )}
        {!multi && documents.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onToggleDone}>
            {status === 'done' ? 'Mark not done' : 'Mark done'}
          </Button>
        )}
      </div>
    </li>
  )
}
