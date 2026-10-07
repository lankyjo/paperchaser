import type { Block } from '../blocks'
import type { RichTextDoc, RichTextNode } from '../richtext'

// Splits sample text into text and placeholder nodes: "[Client name]" becomes a fill-in placeholder.
export function withPlaceholders(text: string): RichTextNode[] {
  return text
    .split(/(\[[^\]]+\])/)
    .filter((part) => part !== '')
    .map((part) => (part.startsWith('[') && part.endsWith(']') ? { type: 'placeholder', text: part.slice(1, -1) } : { type: 'text', text: part }))
}

// A rich-text block from paragraphs; a paragraph may start with a bold lead-in such as "Scope of work."
export function paragraphs(id: string, items: (string | { lead: string; text: string })[]): Block {
  const content: RichTextDoc = items.map((item) =>
    typeof item === 'string'
      ? { type: 'paragraph', content: withPlaceholders(item) }
      : { type: 'paragraph', content: [{ type: 'text', text: `${item.lead} `, marks: [{ type: 'bold' }] }, ...withPlaceholders(item.text)] },
  )
  return { id, type: 'richText', content }
}

export const heading = (id: string, text: string): Block => ({ id, type: 'heading', text })

export type NewId = (n: number) => string
