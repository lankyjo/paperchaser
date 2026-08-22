import type { RichTextDoc, RichTextNode } from '../../document/richtext'

/**
 * Template-agnostic AST node renderer (D-06/D-08).
 *
 * Shared by DocumentPage (view mode) and RichTextCell (edit mode inner render) —
 * one rendering path, parity by construction (D-11).
 *
 * Single-paragraph/single-text ASTs render pixel-identical to plain strings
 * (Pitfall 3 — paragraph margin: 0, no default browser spacing).
 *
 * No template branch anywhere in this file (Anti-Pattern 1).
 */

/** Mark names → HTML tag overrides (null = no wrapper needed). */
type MarkTag = string | null
const MARK_TAGS: Record<string, MarkTag> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  link: 'a',
}

export function AstView({ value }: { value: string | RichTextDoc }) {
  if (typeof value === 'string') return <>{value}</>
  // Golden-preserving shortcut: single-paragraph/single-text AST renders as
  // a plain text node — pixel-identical to the legacy string rendering (Pitfall 3).
  if (
    value.length === 1 &&
    value[0].type === 'paragraph' &&
    value[0].content?.length === 1 &&
    value[0].content[0].type === 'text' &&
    !value[0].content[0].marks?.length
  ) {
    return <>{value[0].content[0].text}</>
  }
  return <>{value.map((node, i) => renderNode(node, i))}</>
}

function renderNode(node: RichTextNode, key: number | string): React.ReactNode {
  switch (node.type) {
    case 'paragraph':
      return (
        <p key={key} style={{ margin: 0 }}>
          {(node.content ?? []).map((child, i) => renderNode(child, i))}
        </p>
      )
    case 'list':
      return (
        <ul key={key} style={{ margin: 0, paddingLeft: '1.5em' }}>
          {(node.content ?? []).map((child, i) => renderNode(child, i))}
        </ul>
      )
    case 'listItem':
      return (
        <li key={key} style={{ margin: 0 }}>
          {(node.content ?? []).map((child, i) => renderNode(child, i))}
        </li>
      )
    case 'text': {
      const marks = node.marks ?? []
      if (marks.length === 0) return node.text

      // Wrap innermost-first: text -> innermost mark -> ... -> outermost mark
      let element: React.ReactNode = node.text
      for (const mark of marks) {
        const tag = MARK_TAGS[mark.type]
        if (tag === 'a') {
          element = <a href={mark.attrs?.href}>{element}</a>
        } else if (tag !== null && tag !== undefined) {
          const Tag = tag as keyof React.JSX.IntrinsicElements
          element = <Tag>{element}</Tag>
        }
      }
      return element
    }
  }
}
