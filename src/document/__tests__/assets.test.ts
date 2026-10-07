import { describe, expect, it } from 'vitest'

import { referencedAssetIds } from '../assets'

describe('referencedAssetIds', () => {
  it('collects asset ids used by image blocks across documents, ignoring documents without blocks', () => {
    const docs = [
      { blocks: [{ id: 'b1', type: 'image' as const, assetId: 'a1', alt: '' }, { id: 'b2', type: 'heading' as const, text: 'x' }] },
      { blocks: [{ id: 'b3', type: 'image' as const, assetId: 'a2', alt: '' }, { id: 'b4', type: 'image' as const, assetId: 'a1', alt: '' }] },
      { blocks: [{ id: 'b5', type: 'signature' as const, assetId: 'sig', name: '', role: '', clientLine: true }] },
      {},
    ]
    expect(referencedAssetIds(docs)).toEqual(new Set(['a1', 'a2', 'sig']))
  })
})

describe('logo and line-item images', () => {
  it('count as references when stored in the asset store, so pruning keeps them', () => {
    const doc = {
      company: { logo: 'asset:logo1' },
      lineItems: [{ image: 'asset:item1' }, { image: 'data:image/png;base64,AAAA' }, {}],
      blocks: [],
    }
    expect(referencedAssetIds([doc])).toEqual(new Set(['logo1', 'item1']))
  })
})
