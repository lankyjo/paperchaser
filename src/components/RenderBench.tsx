import { useState } from 'react'

import { DEMO_DOCUMENT_ID, documentsRepo } from '../db/repos'
import type { DocumentModel } from '../document/types'
import { useMountEffect } from '../lib/useMountEffect'
import { DocumentPage } from './DocumentPage'

/**
 * Render bench shell (Phase-3 surface, NOT the Phase-4 builder): brand header +
 * centered gray canvas rendering the shared DocumentPage on a soft shadow.
 *
 * Data source (D-11): the ?fixture= harness path renders the whitelisted model
 * directly (T-01-01, byte-identical behavior); otherwise the empty store is
 * seeded once with the English Minimal demo and that seeded document renders.
 *
 * Screen-only chrome — .app-shell is hidden under print via print.css
 * (visibility) and #print-root's box-shadow is neutralized there; nothing in
 * this file touches the print projection.
 */
export function RenderBench({ model: fixtureModel }: { model?: DocumentModel }) {
  // Harness path (T-01-01): whitelisted fixture model — render immediately.
  if (fixtureModel !== undefined) {
    return <BenchShell model={fixtureModel} />
  }
  // Demo path (D-11): mount the async seed/load only when actually needed.
  return <DemoDocument />
}

/**
 * The bench chrome around the A4 page block.
 *
 * Print-neutrality contract (no print.css change): the header must not occupy
 * layout space in print — .app-shell's own rules neutralize only the shell, so
 * an in-flow 48px header above #print-root would push the document down the
 * printed page and shift PDF pagination (parity break, measured 0.068 vs 0.05
 * on page 1). `print:hidden` / `print:min-h-0` / `print:pb-0` (Tailwind print:
 * variants) take the chrome out of the printed flow without editing
 * src/styles/print.css — #print-root's subtree is untouched.
 */
function BenchShell({ model }: { model: DocumentModel }) {
  return (
    <div className="flex min-h-screen flex-col print:min-h-0">
      <header className="flex h-12 shrink-0 items-center px-4 print:hidden">
        <span className="text-base font-semibold tracking-tight">Paperchaser</span>
      </header>
      <main className="flex flex-1 justify-center overflow-auto px-6 pb-10 print:pb-0">
        <div style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}>
          <DocumentPage model={model} />
        </div>
      </main>
    </div>
  )
}

/** Empty-store load: seed the demo once, then render it through DocumentPage. */
function DemoDocument() {
  const [model, setModel] = useState<DocumentModel | null>(null)

  useMountEffect(() => {
    void (async () => {
      await documentsRepo.seedDemoIfEmpty()
      setModel((await documentsRepo.get(DEMO_DOCUMENT_ID)) ?? null)
    })()
  })

  if (model === null) return <div className="flex min-h-screen items-center justify-center" />
  return <BenchShell model={model} />
}
