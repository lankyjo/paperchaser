import * as z from 'zod'

import type { Project } from './project'

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  contactPerson: z.string(),
  email: z.string(),
  billingAddress: z.array(z.string()),
  taxId: z.string(),
  archived: z.boolean(),
})

export type Client = z.infer<typeof clientSchema>

export function createClient({ id, name }: { id: string; name: string }): Client {
  return { id, name: name.trim(), contactPerson: '', email: '', billingAddress: [], taxId: '', archived: false }
}

// A client used by any project can only be archived, never deleted.
export function clientUsage(
  clientId: string,
  projects: Pick<Project, 'id' | 'clientId'>[],
  documents: { projectId: string; status: string }[],
) {
  const projectIds = new Set(projects.filter((p) => p.clientId === clientId).map((p) => p.id))
  const drafts = documents.filter((d) => projectIds.has(d.projectId) && d.status === 'draft').length
  return { projects: projectIds.size, drafts, inUse: projectIds.size > 0 }
}
