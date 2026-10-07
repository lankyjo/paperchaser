import { Link } from '@tanstack/react-router'
import { getPlainText } from '../../document/richtext'
import type { ProjectWithDocuments } from './useProjects'

// One project on the home list: its title links to the project page, then its documents.
export function ProjectCard({ entry: { project, documents } }: { entry: ProjectWithDocuments }) {
  return (
    <li className="rounded-lg border bg-card p-4">
      <h2 className="font-medium">
        <Link to="/projects/$projectId" params={{ projectId: project.id }}>
          {project.title || 'Untitled project'}
        </Link>
      </h2>
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
