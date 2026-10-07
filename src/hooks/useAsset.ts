import { useState } from 'react'
import { assetsRepo, type AssetRow } from '../db/repos'
import { useMountEffect } from './useMountEffect'

// Loads a stored image by id; remount with a new key when the id changes.
export function useAsset(id: string): AssetRow | undefined {
  const [asset, setAsset] = useState<AssetRow>()
  useMountEffect(() => {
    if (id !== '') void assetsRepo.get(id).then(setAsset)
  })
  return asset
}
