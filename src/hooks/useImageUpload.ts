import { useState } from 'react'
import { assetsRepo } from '../db/repos'
import { compressImage } from '../lib/compressImage'
import { sha256Hex } from '../lib/sha256Hex'

const isQuotaError = (err: unknown) =>
  err instanceof Error && (err.name === 'QuotaExceededError' || (err as { inner?: Error }).inner?.name === 'QuotaExceededError')

// Compresses and stores an uploaded image once by content hash; returns its asset id, or reports why it failed.
export function useImageUpload() {
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<string | null> => {
    setError(null)
    try {
      const image = await compressImage(file)
      const id = await sha256Hex(image.dataUrl)
      if ((await assetsRepo.get(id)) === undefined) await assetsRepo.put({ id, ...image })
      return id
    } catch (err) {
      setError(isQuotaError(err) ? 'Storage is full. Export a backup and delete old projects to free space.' : 'This file could not be read as an image.')
      return null
    }
  }

  return { upload, error }
}
