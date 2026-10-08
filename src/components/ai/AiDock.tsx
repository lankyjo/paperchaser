import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import type { DocumentModel } from '../../document/types'
import { AiSettingsSection } from '../settings/AiSettingsSection'
import { useAiSettings } from '../settings/useAiSettings'
import { Button } from '../ui/button'
import { AiPanel } from './AiPanel'

// A floating AI button that slides up a panel at the bottom right: connect first if needed, then ask for changes.
export function AiDock({ model, commit }: { model: DocumentModel; commit: (next: DocumentModel) => void }) {
  const [open, setOpen] = useState(false)
  const ai = useAiSettings()
  const connected = ai.settings !== null && ai.hasKey
  return (
    <div className="print:hidden">
      {open && (
        <aside aria-label="AI" className="fixed right-4 bottom-36 z-40 flex h-[min(50dvh,520px)] w-[min(440px,calc(100vw-32px))] animate-in flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl fade-in slide-in-from-bottom-4 duration-200 lg:right-6 lg:bottom-24">
          <header className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4" />AI</span>
            <Button size="icon-sm" variant="ghost" aria-label="Close AI" onClick={() => setOpen(false)}><X /></Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {connected ? <AiPanel model={model} commit={commit} /> : <AiSettingsSection ai={ai} title="Connect an AI model" framed={false} />}
          </div>
        </aside>
      )}
      <button
        type="button"
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-20 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-[0.96] lg:right-6 lg:bottom-6"
      >
        <Sparkles className="size-5" />
      </button>
    </div>
  )
}
