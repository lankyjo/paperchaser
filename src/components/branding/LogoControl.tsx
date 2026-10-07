import { useState } from 'react'
import type { DocumentModel } from '../../document/types'
import { Button } from '../ui/button'
import { useLogoUpload } from './useLogoUpload'

// Logo picker writing company.logo, the only logo the header renders; removal asks for confirmation.
export function LogoControl({
  model,
  onLogoChange,
}: {
  model: DocumentModel
  onLogoChange?: (logo: string | null) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const { logoError, inputRef, readLogoFile } = useLogoUpload(onLogoChange)
  const hasLogo = model.company.logo !== null

  return (
    <div className="space-y-2">
      {hasLogo ? (
        <div className="flex items-center gap-2">
          {/* Fixed 48px chip so a huge source image is never laid out at natural size. */}
          <img
            src={model.company.logo ?? undefined}
            alt=""
            className="size-12 rounded object-cover ring-1 ring-foreground/10"
          />
          <Button type="button" variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            Remove logo
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium">No logo</p>
          <p className="text-xs text-muted-foreground">Add a logo and it appears in the document header.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Add logo
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPG or SVG up to 2 MB</p>
        </>
      )}

      {logoError && (
        <p className="text-xs text-destructive">Couldn't load that file. Use a PNG, JPG or SVG up to 2 MB.</p>
      )}

      {confirming && (
        <div className="space-y-2 rounded-lg border border-destructive/40 p-2">
          <p className="text-sm font-medium">Remove logo?</p>
          <p className="text-xs text-muted-foreground">
            Your logo is removed from this document's branding. You can add it again.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onLogoChange?.(null)
                setConfirming(false)
              }}
            >
              Remove
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          readLogoFile(event.target.files?.[0])
          // Allow re-selecting the same file after a rejected/removed pick.
          event.target.value = ''
        }}
      />
    </div>
  )
}
