import { useRef, useState } from 'react'
import { ASSET_PREFIX } from '../../document/assets'
import { useImageUpload } from '../../hooks/useImageUpload'

const LOGO_ACCEPT = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_LOGO_BYTES = 2 * 1024 * 1024

// Compresses a picked logo into the asset store, rejecting wrong types or files over 2 MB first.
export function useLogoUpload(onLogoChange?: (logo: string | null) => void) {
  const [logoError, setLogoError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload } = useImageUpload()

  const readLogoFile = (file: File | undefined) => {
    if (file === undefined) return
    if (!LOGO_ACCEPT.includes(file.type) || file.size > MAX_LOGO_BYTES) {
      setLogoError(true)
      return
    }
    setLogoError(false)
    void upload(file).then((id) => (id ? onLogoChange?.(`${ASSET_PREFIX}${id}`) : setLogoError(true)))
  }

  return { logoError, inputRef, readLogoFile }
}
