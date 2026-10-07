import type { ImgHTMLAttributes } from 'react'
import { ASSET_PREFIX } from '../../document/assets'
import { useAsset } from '../../hooks/useAsset'

function AssetImage({ assetId, ...props }: ImgHTMLAttributes<HTMLImageElement> & { assetId: string }) {
  const asset = useAsset(assetId)
  return asset ? <img {...props} src={asset.dataUrl} /> : null
}

// A logo or line-item image: inline data: URLs render directly, "asset:" references load from the asset store.
export function LocalImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  if (!src.startsWith(ASSET_PREFIX)) return <img {...props} src={src} />
  const assetId = src.slice(ASSET_PREFIX.length)
  return <AssetImage key={assetId} assetId={assetId} {...props} />
}
