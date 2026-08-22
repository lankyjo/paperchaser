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

/**
 * DOM → AST serializer (whitelist-only, RESEARCH Pitfall 2).
 * Called on `contentEditable` commit to normalize browser-authored DOM
 * (execCommand output varies: <b> vs <strong>, <i> vs <em>) into the
 * canonical AST. Paste is already stripped to plain text before this runs,
 * but the serializer remains a whitelist boundary.
 *
 * - B/STRONG → bold mark, I/EM → italic, U → underline, A → link (href via isSafeHref), UL → list, LI → listItem, P/DIV → paragraph
 * - Unknown tags unwrapped to text content (never passthrough)
 * - Whitespace: collapse multiple spaces → single, trim leading/trailing
 * - Text nodes trimmed-empty are dropped (empty paragraphs handled by caller)
 */
export function domToAst(container: HTMLElement): RichTextDoc {
  const blockNodes: RichTextNode[] = []
  let currentInline: RichTextNode[] = []

  const flushInline = () => {
    const cleaned = currentInline
      .map((n) => (n.type === 'text' ? { ...n, text: collapseWhitespace(n.text as string) } : n))
      .filter((n) => !(n.type === 'text' && (n.text as string).length === 0))
    if (cleaned.length > 0) {
      blockNodes.push({ type: 'paragraph', content: cleaned })
    }
    currentInline = []
  }

  const walkInline = (node: Node, marks: RichTextMark[]): RichTextNode[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = (node as Text).data
      // Preserve raw for later collapse; empty whitespace handled at flush
      if (raw.length === 0) return []
      return [{ type: 'text', text: raw, ...(marks.length ? { marks: [...marks] } : {}) }]
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return []
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    // Block boundaries inside inline walk: treat as inline for now, caller flushes
    if (tag === 'br') return [{ type: 'text', text: '\n', ...(marks.length ? { marks: [...marks] } : {}) }]
    let nextMarks = marks
    if (tag === 'b' || tag === 'strong') nextMarks = [...marks, { type: 'bold' }]
    else if (tag === 'i' || tag === 'em') nextMarks = [...marks, { type: 'italic' }]
    else if (tag === 'u') nextMarks = [...marks, { type: 'underline' }]
    else if (tag === 'a') {
      const href = el.getAttribute('href') ?? ''
      if (isSafeHref(href)) nextMarks = [...marks, { type: 'link', attrs: { href } }]
      // unsafe href: unwrap without link mark
    } else if (tag === 'ul' || tag === 'ol' || tag === 'li' || tag === 'p' || tag === 'div') {
      // Structural tags handled at block level — unwrap children inline here
      // For li/p/div inside inline context, we still walk children with same marks
    } else {
      // Unknown tag: unwrap (whitelist)
    }
    // For list structural tags at top level, they are handled outside walkInline
    if (tag === 'ul' || tag === 'ol') {
      // Should not appear inside inline walk in well-formed execCommand output;
      // unwrap children
      const out: RichTextNode[] = []
      for (const child of Array.from(el.childNodes)) out.push(...walkInline(child, nextMarks))
      return out
    }
    if (tag === 'li') {
      const out: RichTextNode[] = []
      for (const child of Array.from(el.childNodes)) out.push(...walkInline(child, nextMarks))
      return out
    }
    const out: RichTextNode[] = []
    for (const child of Array.from(el.childNodes)) out.push(...walkInline(child, nextMarks))
    return out
  }

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const nodes = walkInline(child, [])
      currentInline.push(...nodes)
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'ul' || tag === 'ol') {
      flushInline()
      const listItems: RichTextNode[] = []
      for (const li of Array.from(el.children)) {
        if ((li as HTMLElement).tagName.toLowerCase() !== 'li') continue
        const liContent: RichTextNode[] = []
        for (const c of Array.from(li.childNodes)) liContent.push(...walkInline(c, []))
        const cleaned = liContent
          .map((n) => (n.type === 'text' ? { ...n, text: collapseWhitespace(n.text as string) } : n))
          .filter((n) => !(n.type === 'text' && (n.text as string).length === 0))
        listItems.push({ type: 'listItem', content: cleaned.length ? cleaned : [{ type: 'text', text: '' }] })
      }
      blockNodes.push({ type: 'list', content: listItems })
    } else if (tag === 'p' || tag === 'div') {
      // Each block element flushes prior inline and creates a paragraph
      // Check if it's a plain wrapper with no block children — treat as paragraph
      flushInline()
      const paraContent: RichTextNode[] = []
      for (const c of Array.from(el.childNodes)) paraContent.push(...walkInline(c, []))
      const cleaned = paraContent
        .map((n) => (n.type === 'text' ? { ...n, text: collapseWhitespace(n.text as string) } : n))
        .filter((n) => !(n.type === 'text' && (n.text as string).length === 0))
      if (cleaned.length > 0) blockNodes.push({ type: 'paragraph', content: cleaned })
      else blockNodes.push({ type: 'paragraph', content: [{ type: 'text', text: '' }] })
    } else if (tag === 'br') {
      currentInline.push({ type: 'text', text: '\n' })
    } else {
      // Inline element at top level (b, i, a, span, etc.) — walk with marks
      const nodes = walkInline(child, [])
      currentInline.push(...nodes)
    }
  }
  flushInline()
  if (blockNodes.length === 0) return [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
  return blockNodes
}

function collapseWhitespace(text: string): string {
  // Collapse multiple spaces/tabs/newlines to single space, trim ends
  // Preserve single \n as paragraph break marker — already handled at block level
  return text.replace(/[ \t\r\n]+/g, ' ').trim()
}
