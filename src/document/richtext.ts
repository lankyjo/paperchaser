/**
 * Pure, renderer-agnostic rich-text AST schemas (D-06/D-07/D-08).
 *
 * JSON-serializable by construction: every value here can round-trip through
 * JSON.stringify/parse untouched. This models a ProseMirror/Tiptap-compatible
 * node-array AST — nothing in this file may depend on React, the DOM, or Dexie.
 */

import * as z from 'zod'

/** D-08: T-04-01 — link href is http, https, or mailto only. No javascript:, data:, or //. */
export const isSafeHref = (href: string): boolean => /^(https?|mailto):/i.test(href)

/**
 * Mark schema: bold, italic, underline, link.
 * link carries an optional attrs.href refined by isSafeHref.
 */
export const richTextMarkSchema = z.object({
  type: z.enum(['bold', 'italic', 'underline', 'link']),
  attrs: z
    .object({
      href: z.string().refine(isSafeHref, {
        message: 'link href must be http, https, or mailto',
      }),
    })
    .optional(),
})

/** Pre-declared shape for the node discriminated union (avoids circular-lazy implicit any). */
interface RichTextNodeShape {
  type: 'text' | 'paragraph' | 'listItem' | 'list'
  text?: string
  content?: RichTextNodeShape[]
  marks?: RichTextMark[]
}

/** T-04-02: known node types only — z.object() default strips unknown keys. */
export const richTextNodeSchema: z.ZodType<RichTextNodeShape> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string(), marks: z.array(richTextMarkSchema).optional() }),
  z.object({ type: z.literal('paragraph'), content: z.array(z.lazy(() => richTextNodeSchema)) }),
  z.object({ type: z.literal('listItem'), content: z.array(z.lazy(() => richTextNodeSchema)) }),
  z.object({ type: z.literal('list'), content: z.array(z.lazy(() => richTextNodeSchema)) }),
])

/** Top-level array of rich-text nodes — the stored shape for every text field. */
export const richTextDocSchema = z.array(richTextNodeSchema)

/** Helper types for consumers (renderer, migration, fixtures). */
export type RichTextDoc = z.infer<typeof richTextDocSchema>
export type RichTextNode = z.infer<typeof richTextNodeSchema>
export type RichTextMark = z.infer<typeof richTextMarkSchema>

/**
 * Extract plain-text content from a textField value (string | RichTextDoc).
 * The renderer uses this to coax string-or-AST fields into a renderable string.
 * A plain string passes through; an AST is recursively flattened.
 */
export function getPlainText(value: string | RichTextDoc): string {
  if (typeof value === 'string') return value
  return value.map(flattenNode).join('')
}

/** Recursively flatten a single AST node to plain text. */
function flattenNode(node: RichTextNode): string {
  if (node.type === 'text') return node.text as string
  return (node.content ?? []).map(flattenNode).join('')
}
