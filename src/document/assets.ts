import type { Block } from './blocks'

// Asset ids still used by any document, so unreferenced images can be pruned.
export function referencedAssetIds(documents: { blocks?: Block[] }[]): Set<string> {
  const ids = new Set<string>()
  for (const doc of documents) {
    for (const block of doc.blocks ?? []) {
      if (block.type === 'image' && block.assetId !== '') ids.add(block.assetId)
    }
  }
  return ids
}
