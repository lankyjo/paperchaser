// Pure, JSON-serializable rich-text AST schemas (ProseMirror-style node arrays); no React, DOM or Dexie.

import * as z from 'zod'

// Link hrefs are http, https or mailto only; javascript:, data: and protocol-relative URLs are rejected.
export const isSafeHref = (href: string): boolean => /^(https?|mailto):/i.test(href)

// Marks: bold, italic, underline, and link with an href checked by isSafeHref.
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

// Pre-declared node shape so the recursive union avoids an implicit any.
interface RichTextNodeShape {
  type: 'text' | 'paragraph' | 'listItem' | 'list' | 'placeholder'
  text?: string
  content?: RichTextNodeShape[]
  marks?: RichTextMark[]
}

// Known node types only; z.object() strips unknown keys.
export const richTextNodeSchema: z.ZodType<RichTextNodeShape> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string(), marks: z.array(richTextMarkSchema).optional() }),
  // A fill-in hint from sample content, distinct from text the user typed in brackets.
  z.object({ type: z.literal('placeholder'), text: z.string() }),
  z.object({ type: z.literal('paragraph'), content: z.array(z.lazy(() => richTextNodeSchema)) }),
  z.object({ type: z.literal('listItem'), content: z.array(z.lazy(() => richTextNodeSchema)) }),
  z.object({ type: z.literal('list'), content: z.array(z.lazy(() => richTextNodeSchema)) }),
])

// Top-level array of rich-text nodes: the stored shape for every text field.
export const richTextDocSchema = z.array(richTextNodeSchema)

export type RichTextDoc = z.infer<typeof richTextDocSchema>
export type RichTextNode = z.infer<typeof richTextNodeSchema>
type RichTextMark = z.infer<typeof richTextMarkSchema>

// Flattens a string-or-AST text field to plain text.
export function getPlainText(value: string | RichTextDoc): string {
  if (typeof value === 'string') return value
  return value.map(flattenNode).join('')
}

function flattenNode(node: RichTextNode): string {
  if (node.type === 'text') return node.text as string
  if (node.type === 'placeholder') return `[${node.text}]`
  return (node.content ?? []).map(flattenNode).join('')
}

// Number of placeholder nodes in a text field; plain strings never contain any.
export function countPlaceholderNodes(value: string | RichTextDoc): number {
  if (typeof value === 'string') return 0
  const count = (node: RichTextNode): number => (node.type === 'placeholder' ? 1 : (node.content ?? []).reduce((n, c) => n + count(c), 0))
  return value.reduce((n, node) => n + count(node), 0)
}

// Serializes contentEditable DOM into the canonical AST; tags outside the whitelist are unwrapped to their text, never passed through.
export function domToAst(container: HTMLElement): RichTextDoc {
  const blockNodes: RichTextNode[] = []
  let currentInline: RichTextNode[] = []

  const flushInline = () => {
    const cleaned = cleanInline(currentInline)
    if (cleaned.length > 0) blockNodes.push({ type: 'paragraph', content: cleaned })
    currentInline = []
  }

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      currentInline.push(...walkInline(child, []))
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'ul' || tag === 'ol') {
      flushInline()
      blockNodes.push(listToAst(el))
    } else if (tag === 'p' || tag === 'div') {
      flushInline()
      blockNodes.push(paragraphToAst(el))
    } else if (tag === 'br') {
      currentInline.push({ type: 'text', text: '\n' })
    } else {
      currentInline.push(...walkInline(child, []))
    }
  }
  flushInline()
  if (blockNodes.length === 0) return [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
  return blockNodes
}

// Collapses whitespace in text nodes and drops the ones left empty.
function cleanInline(nodes: RichTextNode[]): RichTextNode[] {
  return nodes
    .map((n) => (n.type === 'text' ? { ...n, text: collapseWhitespace(n.text as string) } : n))
    .filter((n) => !(n.type === 'text' && (n.text as string).length === 0))
}

function walkChildren(el: Node, marks: RichTextMark[]): RichTextNode[] {
  const out: RichTextNode[] = []
  for (const child of Array.from(el.childNodes)) out.push(...walkInline(child, marks))
  return out
}

function listToAst(el: HTMLElement): RichTextNode {
  const listItems: RichTextNode[] = []
  for (const li of Array.from(el.children)) {
    if ((li as HTMLElement).tagName.toLowerCase() !== 'li') continue
    const cleaned = cleanInline(walkChildren(li, []))
    listItems.push({ type: 'listItem', content: cleaned.length ? cleaned : [{ type: 'text', text: '' }] })
  }
  return { type: 'list', content: listItems }
}

function paragraphToAst(el: HTMLElement): RichTextNode {
  const cleaned = cleanInline(walkChildren(el, []))
  return { type: 'paragraph', content: cleaned.length > 0 ? cleaned : [{ type: 'text', text: '' }] }
}

// Adds the mark a formatting tag implies; links with an unsafe href are unwrapped without a mark.
function marksForTag(el: HTMLElement, tag: string, marks: RichTextMark[]): RichTextMark[] {
  if (tag === 'b' || tag === 'strong') return [...marks, { type: 'bold' }]
  if (tag === 'i' || tag === 'em') return [...marks, { type: 'italic' }]
  if (tag === 'u') return [...marks, { type: 'underline' }]
  if (tag === 'a') {
    const href = el.getAttribute('href') ?? ''
    if (isSafeHref(href)) return [...marks, { type: 'link', attrs: { href } }]
  }
  return marks
}

function walkInline(node: Node, marks: RichTextMark[]): RichTextNode[] {
  const markProps = () => (marks.length ? { marks: [...marks] } : {})
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = (node as Text).data
    if (raw.length === 0) return []
    return [{ type: 'text', text: raw, ...markProps() }]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  if (tag === 'br') return [{ type: 'text', text: '\n', ...markProps() }]
  if (el.dataset.placeholderNode !== undefined) return [{ type: 'placeholder', text: el.dataset.placeholderNode }]
  return walkChildren(el, marksForTag(el, tag, marks))
}

function collapseWhitespace(text: string): string {
  return text.replace(/[ \t\r\n]+/g, ' ').trim()
}
