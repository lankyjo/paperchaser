import { LocalImage } from '../document-page/LocalImage'
import { useLogoUpload } from '../branding/useLogoUpload'
import { Button } from '../ui/button'

// A logo preview with add, change and remove buttons, storing the picked file as a compressed asset.
export function LogoPicker({ label, value, onChange }: { label: string; value: string | null; onChange: (logo: string | null) => void }) {
  const { logoError, inputRef, readLogoFile } = useLogoUpload(onChange)
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {value !== null && <LocalImage src={value} alt={label} className="size-12 rounded object-contain ring-1 ring-foreground/10" />}
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          {value === null ? 'Add' : 'Change'}
        </Button>
        {value !== null && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          aria-label={`${label} file`}
          className="hidden"
          onChange={(e) => {
            readLogoFile(e.target.files?.[0])
            // Lets the same file be picked again after removing it.
            e.target.value = ''
          }}
        />
      </div>
      {logoError && <p className="text-xs text-destructive">Couldn't load that file. Use a PNG, JPG or SVG up to 2 MB.</p>}
    </div>
  )
}
