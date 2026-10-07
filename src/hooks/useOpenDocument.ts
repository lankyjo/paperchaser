import { useNavigate } from '@tanstack/react-router'
import type { DocumentModel } from '../document/types'

// Opens a document's editor, given the document or its id.
export function useOpenDocument() {
  const navigate = useNavigate()
  return (doc: Pick<DocumentModel, 'id'> | string) => navigate({ to: '/documents/$documentId', params: { documentId: typeof doc === 'string' ? doc : doc.id } })
}
