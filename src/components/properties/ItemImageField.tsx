import { useRef } from 'react'
import { ASSET_PREFIX } from '../../document/assets'
import { useImageUpload } from '../../hooks/useImageUpload'
import { LocalImage } from '../document-page/LocalImage'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

// Optional line-item image, compressed into the asset store, with a thumbnail preview.
export function ItemImageField({ image, onChange, onRemove }: { image?: string; onChange: (dataUrl: string | null) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, error } = useImageUpload()

  const handleFile = (file: File | undefined) => {
    if (file !== undefined) void upload(file).then((id) => id && onChange(`${ASSET_PREFIX}${id}`))
  }

  return (
    <div className="space-y-2">
      <Label>Image</Label>
      {image ? (
        <div className="space-y-2">
          <LocalImage src={image} alt="" className="aspect-square w-24 rounded-md object-cover ring-1 ring-foreground/10" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Add image
          </Button>
          <p className="text-xs text-muted-foreground">Optional image shown in the item row.</p>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}
