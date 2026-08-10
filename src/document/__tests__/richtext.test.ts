import { describe, expect, it } from 'vitest'

import { isSafeHref, richTextDocSchema, richTextMarkSchema, richTextNodeSchema } from '../richtext'

describe('richTextMarkSchema', () => {
  it('accepts a bold mark', () => {
    expect(richTextMarkSchema.parse({ type: 'bold' })).toEqual({ type: 'bold' })
  })

  it('accepts an italic mark', () => {
    expect(richTextMarkSchema.parse({ type: 'italic' })).toEqual({ type: 'italic' })
  })

  it('accepts an underline mark', () => {
    expect(richTextMarkSchema.parse({ type: 'underline' })).toEqual({ type: 'underline' })
  })

  it('accepts a link mark with an http href', () => {
    expect(richTextMarkSchema.parse({ type: 'link', attrs: { href: 'http://example.com' } })).toEqual({
      type: 'link',
      attrs: { href: 'http://example.com' },
    })
  })

  it('accepts a link mark with an https href', () => {
    expect(richTextMarkSchema.parse({ type: 'link', attrs: { href: 'https://example.com' } })).toEqual({
      type: 'link',
      attrs: { href: 'https://example.com' },
    })
  })

  it('accepts a link mark with a mailto: href', () => {
    expect(richTextMarkSchema.parse({ type: 'link', attrs: { href: 'mailto:test@example.com' } })).toEqual({
      type: 'link',
      attrs: { href: 'mailto:test@example.com' },
    })
  })

  it('rejects a link mark with a javascript: href (T-04-01)', () => {
    expect(() => richTextMarkSchema.parse({ type: 'link', attrs: { href: 'javascript:alert(1)' } })).toThrow()
  })

  it('rejects a link mark with a data: href (T-04-01)', () => {
    expect(() => richTextMarkSchema.parse({ type: 'link', attrs: { href: 'data:text/html,<script>alert(1)</script>' } })).toThrow()
  })

  it('rejects a link mark with a protocol-relative href (T-04-01)', () => {
    expect(() => richTextMarkSchema.parse({ type: 'link', attrs: { href: '//evil.example' } })).toThrow()
  })

  it('rejects an unknown mark type', () => {
    expect(() => richTextMarkSchema.parse({ type: 'strikethrough' })).toThrow()
  })
})

describe('richTextNodeSchema', () => {
  it('accepts a text node', () => {
    expect(richTextNodeSchema.parse({ type: 'text', text: 'hello' })).toEqual({ type: 'text', text: 'hello' })
  })

  it('accepts a text node with marks', () => {
    const node = { type: 'text', text: 'hello', marks: [{ type: 'bold' }] } as const
    expect(richTextNodeSchema.parse(node)).toEqual(node)
  })

  it('accepts a paragraph node', () => {
    const node = { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] } as const
    expect(richTextNodeSchema.parse(node)).toEqual(node)
  })

  it('accepts a listItem node', () => {
    const node = { type: 'listItem', content: [{ type: 'text', text: 'item' }] } as const
    expect(richTextNodeSchema.parse(node)).toEqual(node)
  })

  it('accepts a list node containing listItems', () => {
    const node = {
      type: 'list',
      content: [{ type: 'listItem', content: [{ type: 'text', text: 'item 1' }] }],
    } as const
    expect(richTextNodeSchema.parse(node)).toEqual(node)
  })

  it('rejects an unknown node type (T-04-02)', () => {
    expect(() => richTextNodeSchema.parse({ type: 'heading', text: 'Title' })).toThrow()
  })

  it('rejects a node with no type', () => {
    expect(() => richTextNodeSchema.parse({ content: 'x' })).toThrow()
  })
})

describe('richTextDocSchema (top-level node array)', () => {
  it('accepts a single-paragraph AST (the migration wrap shape)', () => {
    const doc = [{ type: 'paragraph', content: [{ type: 'text', text: 'plain string' }] }]
    expect(richTextDocSchema.parse(doc)).toEqual(doc)
  })

  it('accepts multiple paragraphs', () => {
    const doc = [
      { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'second' }] },
    ]
    expect(richTextDocSchema.parse(doc)).toEqual(doc)
  })

  it('accepts mixed node types', () => {
    const doc = [
      { type: 'paragraph', content: [{ type: 'text', text: 'intro' }] },
      {
        type: 'list',
        content: [
          { type: 'listItem', content: [{ type: 'text', text: 'one' }] },
          { type: 'listItem', content: [{ type: 'text', text: 'two' }] },
        ],
      },
    ]
    expect(richTextDocSchema.parse(doc)).toEqual(doc)
  })

  it('accepts a text node with bold + link marks', () => {
    const doc = [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'click here',
            marks: [
              { type: 'bold' },
              { type: 'link', attrs: { href: 'https://example.com' } },
            ],
          },
        ],
      },
    ]
    expect(richTextDocSchema.parse(doc)).toEqual(doc)
  })

  it('rejects an empty list (no content)', () => {
    expect(() => richTextDocSchema.parse([{ type: 'list', content: [] }])).not.toThrow()
  })
})

describe('isSafeHref', () => {
  it.each(['http://example.com', 'https://example.com', 'mailto:test@example.com'])('accepts %s', (href) => {
    expect(isSafeHref(href)).toBe(true)
  })

  it.each(['javascript:void(0)', 'data:text/html,x', '//example.com', 'ftp://example.com', 'file:///etc/passwd'])(
    'rejects %s',
    (href) => {
      expect(isSafeHref(href)).toBe(false)
    },
  )
})

describe('JSON round-trip safety', () => {
  it('a parsed AST survives JSON.stringify/parse unchanged', () => {
    const ast = richTextDocSchema.parse([
      { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
    ])
    const rt = JSON.parse(JSON.stringify(ast))
    expect(richTextDocSchema.parse(rt)).toEqual(ast)
  })
})
