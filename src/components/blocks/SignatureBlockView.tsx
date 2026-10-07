import { useState } from 'react'
import type { Block } from '../../document/blocks'
import { useImageUpload } from '../../hooks/useImageUpload'
import { PlainTextCell } from '../edit/PlainTextCell'
import { labelStyle } from './blockStyles'
import { SignaturePad } from './SignaturePad'
import { StoredImage } from './StoredImage'

type SignatureBlock = Extract<Block, { type: 'signature' }>

const lineStyle = { borderTop: '1px solid var(--tpl-ink)', paddingTop: '4px', marginTop: '28px' } as const

// The freelancer's signature (drawn or uploaded) above their name, plus a blank line for the client to sign on paper.
export function SignatureBlockView({ block, onChange }: { block: SignatureBlock; onChange?: (next: Block) => void }) {
  const { upload, store, error } = useImageUpload()
  const [drawing, setDrawing] = useState(false)
  const editable = onChange !== undefined

  return (
    <section style={{ display: 'grid', gridTemplateColumns: block.clientLine ? '1fr 1fr' : '1fr', gap: '32px' }}>
      <div>
        {block.assetId !== '' && <StoredImage key={block.assetId} assetId={block.assetId} alt={`Signature of ${block.name}`} style={{ maxHeight: '60px' }} />}
        <div style={block.assetId === '' ? lineStyle : { borderTop: '1px solid var(--tpl-ink)', paddingTop: '4px' }}>
          <div style={{ fontWeight: 600 }}><PlainTextCell value={block.name} placeholder="Your name" editable={editable} onCommit={(name) => onChange?.({ ...block, name })} /></div>
          <div style={labelStyle}><PlainTextCell value={block.role} placeholder="Role" editable={editable} onCommit={(role) => onChange?.({ ...block, role })} /></div>
        </div>
        {onChange && (
          <div className="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground print:hidden">
            {drawing ? (
              <SignaturePad onSave={(image) => void store(image).then((assetId) => { if (assetId) onChange({ ...block, assetId }); setDrawing(false) })} />
            ) : (
              <button type="button" className="self-start underline" onClick={() => setDrawing(true)}>
                Draw signature
              </button>
            )}
            <input type="file" accept="image/*" aria-label="Upload signature" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void upload(file).then((assetId) => assetId && onChange({ ...block, assetId }))
            }} />
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={block.clientLine} onChange={(e) => onChange({ ...block, clientLine: e.target.checked })} />
              Client signature line
            </label>
            {error && <p role="alert" className="text-destructive">{error}</p>}
          </div>
        )}
      </div>
      {block.clientLine && (
        <div>
          <div style={lineStyle}>Client signature</div>
          <div style={{ ...lineStyle, marginTop: '20px' }}>Name and date</div>
        </div>
      )}
    </section>
  )
}
