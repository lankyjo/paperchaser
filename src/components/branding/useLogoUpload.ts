import { useRef, useState } from 'react'

const LOGO_ACCEPT = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_LOGO_BYTES = 2 * 1024 * 1024

// Reads a picked logo file into a data: URL, rejecting wrong types or files over 2 MB before reading them.
export function useLogoUpload(onLogoChange?: (logo: string | null) => void) {
  const [logoError, setLogoError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const readLogoFile = (file: File | undefined) => {
    if (file === undefined) return
    if (!LOGO_ACCEPT.includes(file.type) || file.size > MAX_LOGO_BYTES) {
      setLogoError(true)
      return
    }
    setLogoError(false)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onLogoChange?.(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return { logoError, inputRef, readLogoFile }
}
