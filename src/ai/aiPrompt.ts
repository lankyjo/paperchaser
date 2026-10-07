import * as z from 'zod'

import type { DocumentModel } from '../document/types'
import { stripImages } from './aiPatch'

// The edits the model must return: a short summary plus JSON-pointer operations.
export const replySchema = z.object({
  summary: z.string(),
  operations: z.array(z.object({ op: z.enum(['replace', 'add', 'remove']), path: z.string().startsWith('/'), valueJson: z.string() })),
})

const SYSTEM = `You edit business documents for a freelancer. The user message contains the current document as JSON and an instruction.
Return a short summary of the change and a list of operations, where each operation is {"op": "replace"|"add"|"remove", "path": JSON Pointer into the document, "valueJson": the new value encoded as a JSON string ("" for remove)}.
Keep every other field unchanged. Never change id, projectId, type, number, status, payments, currency or any field you were not asked about. Image values like "[image:0]" must be kept exactly. Rich text is an array of {"type":"paragraph","content":[{"type":"text","text":"..."}]} nodes. Write in the document's language and keep a professional, friendly tone.`

export function buildAiPrompt(doc: DocumentModel, instruction: string) {
  const { doc: stripped, images } = stripImages(doc)
  return { system: SYSTEM, user: `Instruction: ${instruction}\n\nDocument:\n${JSON.stringify(stripped)}`, images }
}

export type AiReply = z.infer<typeof replySchema>
