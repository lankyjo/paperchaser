import type { Block } from './blocks'

// Marks a logo or line-item image stored in the asset store, e.g. "asset:<hash>".
export const ASSET_PREFIX = 'asset:'

interface WithImages {
  blocks?: Block[]
  company?: { logo: string | null; logoOnDark?: string | null }
  lineItems?: { image?: string }[]
}

// Asset ids still used by any document (blocks, logo, line-item images), so unreferenced images can be pruned.
export function referencedAssetIds(documents: WithImages[]): Set<string> {
  const ids = new Set<string>()
  const addRef = (value: string | null | undefined) => value?.startsWith(ASSET_PREFIX) && ids.add(value.slice(ASSET_PREFIX.length))
  for (const doc of documents) {
    addRef(doc.company?.logo)
    addRef(doc.company?.logoOnDark)
    doc.lineItems?.forEach((item) => addRef(item.image))
    for (const block of doc.blocks ?? []) {
      if ((block.type === 'image' || block.type === 'signature') && block.assetId !== '') ids.add(block.assetId)
    }
  }
  return ids
}
