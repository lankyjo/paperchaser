import { Button } from '../ui/button'
import { useSignaturePad } from './useSignaturePad'

// Drawing area for a signature with clear and save; saving hands back a trimmed image.
export function SignaturePad({ onSave }: { onSave: (image: { dataUrl: string; width: number; height: number }) => void }) {
  const { canvasRef, handlers, clear, exportTrimmed } = useSignaturePad()
  return (
    <div className="flex flex-col gap-1 print:hidden">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        aria-label="Signature drawing area"
        className="w-full max-w-sm touch-none rounded border bg-white"
        {...handlers}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={clear}>
          Clear
        </Button>
        <Button
          size="sm"
          onClick={() => {
            const image = exportTrimmed()
            if (image) onSave(image)
          }}
        >
          Use signature
        </Button>
      </div>
    </div>
  )
}
