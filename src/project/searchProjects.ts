import type { Project } from './project'

// Projects to list: archived only when shown, and only those whose title or client name contains the query.
export function filterProjects<T extends Pick<Project, 'title' | 'clientId' | 'archived'>>(
  projects: T[],
  clientNames: Map<string, string>,
  query: string,
  showArchived: boolean,
): T[] {
  const q = query.trim().toLowerCase()
  return projects.filter((p) => {
    if (p.archived && !showArchived) return false
    const client = p.clientId === undefined ? '' : (clientNames.get(p.clientId) ?? '')
    return q === '' || p.title.toLowerCase().includes(q) || client.toLowerCase().includes(q)
  })
}
