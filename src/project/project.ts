import * as z from 'zod'

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  state: z.enum(['lead', 'active', 'completed', 'lost']),
  archived: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type Project = z.infer<typeof projectSchema>

export function createProject({ id, title, now }: { id: string; title: string; now: string }): Project {
  return { id, title: title.trim(), state: 'active', archived: false, createdAt: now, updatedAt: now }
}
