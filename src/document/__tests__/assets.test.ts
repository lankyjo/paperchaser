import { describe, expect, it } from 'vitest'

import { referencedAssetIds } from '../assets'

describe('referencedAssetIds', () => {
  it('collects asset ids used by image blocks across documents, ignoring documents without blocks', () => {
    const docs = [
      { blocks: [{ id: 'b1', type: 'image' as const, assetId: 'a1', alt: '' }, { id: 'b2', type: 'heading' as const, text: 'x' }] },
      { blocks: [{ id: 'b3', type: 'image' as const, assetId: 'a2', alt: '' }, { id: 'b4', type: 'image' as const, assetId: 'a1', alt: '' }] },
      {},
    ]
    expect(referencedAssetIds(docs)).toEqual(new Set(['a1', 'a2']))
  })
})
