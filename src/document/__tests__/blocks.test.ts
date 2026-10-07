import { describe, expect, it } from 'vitest'

import { addBlock, blockSchema, moveBlock, toggleBlockHidden, updateBlock, type Block } from '../blocks'

const heading: Block = { id: 'b1', type: 'heading', text: 'Welcome' }
const intro: Block = { id: 'b2', type: 'richText', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }] }
const glance: Block = { id: 'b3', type: 'keyValue', title: 'At a glance', rows: [{ label: 'Start', value: '1 Nov' }] }
const files: Block = { id: 'b4', type: 'table', columns: ['File', 'Format'], rows: [['Logo', 'SVG']] }
const nextSteps: Block = { id: 'b5', type: 'steps', items: [{ title: 'Discovery call', description: 'Align on goals' }] }
const blocks = [heading, intro, glance]

describe('blockSchema', () => {
  it('round-trips every tracer block type through JSON', () => {
    for (const block of [...blocks, files, nextSteps]) expect(blockSchema.parse(JSON.parse(JSON.stringify(block)))).toEqual(block)
  })
})

describe('block operations', () => {
  it('adds an empty block of a type after a given block', () => {
    const next = addBlock(blocks, 'keyValue', 'b1', 'new')
    expect(next.map((b) => b.id)).toEqual(['b1', 'new', 'b2', 'b3'])
    expect(next[1]).toEqual({ id: 'new', type: 'keyValue', title: '', rows: [{ label: '', value: '' }] })
  })

  it('starts a table with two columns and one row, and steps with one item', () => {
    expect(addBlock([], 'table', null, 't')[0]).toEqual({ id: 't', type: 'table', columns: ['', ''], rows: [['', '']] })
    expect(addBlock([], 'steps', null, 's')[0]).toEqual({ id: 's', type: 'steps', items: [{ title: '', description: '' }] })
  })

  it('moves a block up or down and ignores moves past either end', () => {
    expect(moveBlock(blocks, 'b3', -1).map((b) => b.id)).toEqual(['b1', 'b3', 'b2'])
    expect(moveBlock(blocks, 'b1', -1)).toEqual(blocks)
  })

  it('toggles hidden and updates a block by id without touching others', () => {
    expect(toggleBlockHidden(blocks, 'b2')[1]).toMatchObject({ id: 'b2', hidden: true })
    expect(updateBlock(blocks, { ...heading, text: 'Hello' })[0]).toEqual({ ...heading, text: 'Hello' })
    expect(updateBlock(blocks, { ...heading, text: 'Hello' }).slice(1)).toEqual(blocks.slice(1))
  })
})
