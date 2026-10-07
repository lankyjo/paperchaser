import * as z from 'zod'

import { workspaceBundleSchema } from './backup'

// JSON Schema for workspace backup files, generated from the same Zod schema the importer validates with.
export function workspaceJsonSchema(): object {
  return z.toJSONSchema(workspaceBundleSchema, { unrepresentable: 'any' })
}
