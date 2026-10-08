import { useParams } from '@tanstack/react-router'
import { StoredDocument } from '../components/builder/StoredDocument'

export function DocumentRoute() {
  const { documentId } = useParams({ from: '/_app/documents/$documentId' })
  return <StoredDocument key={documentId} documentId={documentId} />
}
