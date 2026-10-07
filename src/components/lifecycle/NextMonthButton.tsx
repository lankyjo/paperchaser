import { useNavigate } from '@tanstack/react-router'
import { documentsRepo } from '../../db/repos'
import { forNextMonth } from '../../document/nextMonth'
import type { DocumentModel } from '../../document/types'
import { Button } from '../ui/button'

// Starts next month's invoice or report from this one, for retainer clients.
export function NextMonthButton({ doc }: { doc: DocumentModel }) {
  const navigate = useNavigate()
  const create = async () => {
    const next = forNextMonth(doc, crypto.randomUUID())
    await documentsRepo.put(next)
    await navigate({ to: '/documents/$documentId', params: { documentId: next.id } })
  }
  return (
    <Button size="sm" variant="outline" onClick={() => void create()}>
      New for next month
    </Button>
  )
}
