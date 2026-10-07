import * as z from 'zod'

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  state: z.enum(['lead', 'active', 'completed', 'lost']),
  archived: z.boolean(),
  clientId: z.string().optional(),
  // Who a lead is being pitched to before they become a real client.
  prospectName: z.string().optional(),
  feeMinor: z.int().nonnegative().optional(),
  startDate: z.iso.date().optional(),
  dueDate: z.iso.date().optional(),
  deliverables: z.array(z.string()).optional(),
  taxMode: z.enum(['exclusive', 'inclusive', 'none']).optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  // Single-document steps the user has marked finished.
  doneSteps: z.array(z.string()).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type Project = z.infer<typeof projectSchema>

export function createProject({ id, title, now }: { id: string; title: string; now: string }): Project {
  return { id, title: title.trim(), state: 'active', archived: false, createdAt: now, updatedAt: now }
}
