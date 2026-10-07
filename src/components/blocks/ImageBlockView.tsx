import type { Block } from '../../document/blocks'
import { useImageUpload } from '../../hooks/useImageUpload'
import { StoredImage } from './StoredImage'

type ImageBlock = Extract<Block, { type: 'image' }>

// An uploaded image; while editing, a file picker replaces it and errors (bad file, storage full) are shown.
export function ImageBlockView({ block, onChange }: { block: ImageBlock; onChange?: (next: Block) => void }) {
  const { upload, error } = useImageUpload()
  return (
    <figure style={{ margin: 0 }}>
      {block.assetId !== '' && <StoredImage key={block.assetId} assetId={block.assetId} alt={block.alt} />}
      {onChange && (
        <div className="mt-1 flex flex-col gap-1 text-[11px] text-muted-foreground print:hidden">
          <input
            type="file"
            accept="image/*"
            aria-label="Upload image"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void upload(file).then((assetId) => assetId && onChange({ ...block, assetId }))
            }}
          />
          <input
            aria-label="Image description"
            placeholder="Describe the image"
            className="rounded border px-1"
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
          />
          {error && <p role="alert" className="text-destructive">{error}</p>}
        </div>
      )}
    </figure>
  )
}
