import { useRef } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

// Optional line-item image picked from a file and stored as a data: URL, with a thumbnail preview.
export function ItemImageField({ image, onChange, onRemove }: { image?: string; onChange: (dataUrl: string | null) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (file === undefined) return
    // ponytail: no size limit on item images; add one if stored documents grow too large
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <Label>Image</Label>
      {image ? (
        <div className="space-y-2">
          <img src={image} alt="" className="max-h-24 max-w-full rounded object-contain ring-1 ring-foreground/10" />
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
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}
