import { describe, expect, it } from 'vitest'

import { addBlock, blockSchema, moveBlock, toggleBlockHidden, updateBlock, type Block } from '../blocks'

const heading: Block = { id: 'b1', type: 'heading', text: 'Welcome' }
const intro: Block = { id: 'b2', type: 'richText', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }] }
const glance: Block = { id: 'b3', type: 'keyValue', title: 'At a glance', rows: [{ label: 'Start', value: '1 Nov' }] }
const files: Block = { id: 'b4', type: 'table', columns: ['File', 'Format'], rows: [['Logo', 'SVG']] }
const nextSteps: Block = { id: 'b5', type: 'steps', items: [{ title: 'Discovery call', description: 'Align on goals' }] }
const kpis: Block = { id: 'b6', type: 'metrics', items: [{ label: 'Views', value: '200K', note: '+12%' }] }
const trend: Block = { id: 'b7', type: 'chart', title: 'Views by week', series: [{ label: 'W1', value: 120 }] }
const ratings: Block = { id: 'b8', type: 'rating', title: 'Overall', questions: [{ text: 'Communication', answer: 4 }, { text: 'Quality' }] }
const checks: Block = { id: 'b9', type: 'checklist', title: 'Before you post', items: [{ text: 'Read the guide', checked: true }] }
const blocks = [heading, intro, glance]

describe('blockSchema', () => {
  it('round-trips every tracer block type through JSON', () => {
    for (const block of [...blocks, files, nextSteps, kpis, trend, ratings, checks]) expect(blockSchema.parse(JSON.parse(JSON.stringify(block)))).toEqual(block)
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

  it('starts metrics with three empty tiles and a chart with two empty bars', () => {
    expect(addBlock([], 'metrics', null, 'm')[0]).toMatchObject({ type: 'metrics', items: [{}, {}, {}] })
    expect(addBlock([], 'chart', null, 'c')[0]).toEqual({ id: 'c', type: 'chart', title: '', series: [{ label: '', value: 0 }, { label: '', value: 0 }] })
  })

  it('starts a rating with one unanswered question and a checklist with one unchecked item', () => {
    expect(addBlock([], 'rating', null, 'r')[0]).toEqual({ id: 'r', type: 'rating', title: '', questions: [{ text: '' }] })
    expect(addBlock([], 'checklist', null, 'k')[0]).toEqual({ id: 'k', type: 'checklist', title: '', items: [{ text: '' }] })
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

describe('image block', () => {
  it('round-trips and starts empty with no asset', () => {
    const image: Block = { id: 'i', type: 'image', assetId: 'abc', alt: 'Moodboard' }
    expect(blockSchema.parse(JSON.parse(JSON.stringify(image)))).toEqual(image)
    expect(addBlock([], 'image', null, 'i')[0]).toEqual({ id: 'i', type: 'image', assetId: '', alt: '' })
  })
})
