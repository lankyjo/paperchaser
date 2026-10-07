import { describe, expect, it } from 'vitest'
import { paginate } from '../pagination'

const atomic = (id: string, height: number) => ({ id, height, units: [] })

describe('paginate', () => {
  it('keeps everything on one page when it fits', () => {
    expect(paginate([atomic('a', 100), atomic('b', 200)], 500)).toEqual({ pages: [[{ id: 'a' }, { id: 'b' }]], oversized: [] })
  })

  it('moves a whole block that does not fit to the next page', () => {
    expect(paginate([atomic('a', 300), atomic('b', 300)], 500).pages).toEqual([[{ id: 'a' }], [{ id: 'b' }]])
  })

  it('splits a splittable block by unit, counting its overhead on every page', () => {
    // 20px header row repeated per fragment plus five 100px rows.
    const table = { id: 't', height: 520, units: [100, 100, 100, 100, 100] }
    expect(paginate([atomic('a', 200), table], 500).pages).toEqual([
      [{ id: 'a' }, { id: 't', range: [0, 2] }],
      [{ id: 't', range: [2, 5] }],
    ])
  })

  it('starts a split block on a new page when not even one unit fits', () => {
    const table = { id: 't', height: 220, units: [100, 100] }
    expect(paginate([atomic('a', 450), table], 500).pages).toEqual([[{ id: 'a' }], [{ id: 't' }]])
  })

  it('places an oversized atomic block alone on its own page and reports it', () => {
    expect(paginate([atomic('a', 100), atomic('big', 900), atomic('c', 100)], 500)).toEqual({
      pages: [[{ id: 'a' }], [{ id: 'big' }], [{ id: 'c' }]],
      oversized: ['big'],
    })
  })

  it('reports a single unit taller than a page', () => {
    const text = { id: 'r', height: 800, units: [100, 700] }
    expect(paginate([text], 500)).toEqual({ pages: [[{ id: 'r', range: [0, 1] }], [{ id: 'r', range: [1, 2] }]], oversized: ['r'] })
  })

  it('keeps a heading on the same page as the block after it', () => {
    const heading = { id: 'h', height: 40, units: [], keepWithNext: true }
    expect(paginate([atomic('a', 440), heading, atomic('b', 100)], 500).pages).toEqual([[{ id: 'a' }], [{ id: 'h' }, { id: 'b' }]])
  })
})
