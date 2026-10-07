import type { CSSProperties } from 'react'
import { useAsset } from '../../hooks/useAsset'

// Renders an image from the asset store; nothing until it has loaded.
export function StoredImage({ assetId, alt, style }: { assetId: string; alt: string; style?: CSSProperties }) {
  const asset = useAsset(assetId)
  if (asset === undefined) return null
  return <img src={asset.dataUrl} alt={alt} style={{ display: 'block', maxWidth: '100%', height: 'auto', ...style }} />
}
