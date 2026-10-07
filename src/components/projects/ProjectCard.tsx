import { Link } from '@tanstack/react-router'
import { getPlainText } from '../../document/richtext'
import type { Client } from '../../project/client'
import { ClientPicker } from './ClientPicker'
import type { ProjectWithDocuments } from './useProjects'

interface ProjectCardProps {
  entry: ProjectWithDocuments
  clients: Client[]
  onPickClient: (clientId: string | undefined) => void
  onCreateClient: (name: string) => void
}

// One project: its title, client and links to its documents.
export function ProjectCard({ entry: { project, documents }, clients, onPickClient, onCreateClient }: ProjectCardProps) {
  const title = project.title || 'Untitled project'
  return (
    <li className="rounded-lg border bg-card p-4">
      <h2 className="font-medium">{title}</h2>
      <ClientPicker projectTitle={title} clientId={project.clientId} clients={clients} onPick={onPickClient} onCreate={onCreateClient} />
      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {documents.map((doc) => (
          <li key={doc.id}>
            <Link to="/documents/$documentId" params={{ documentId: doc.id }} className="underline">
              {doc.type} {getPlainText(doc.number) || 'draft'}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  )
}
