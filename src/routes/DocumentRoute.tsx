import { useLoaderData, useParams } from '@tanstack/react-router'
import { StoredDocument } from '../components/builder/StoredDocument'

export function DocumentRoute() {
  const { documentId } = useParams({ from: '/_app/documents/$documentId' })
  const loaded = useLoaderData({ from: '/_app/documents/$documentId' })
  if (loaded === null) return <p className="p-6 text-sm">Document not found.</p>
  return <StoredDocument key={documentId} loaded={loaded} />
}
