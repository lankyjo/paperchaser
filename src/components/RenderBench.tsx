import { useState } from 'react'

import { DEMO_DOCUMENT_ID, documentsRepo } from '../db/repos'
import { PAGE_SIZES } from '../document/tokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import { useMountEffect } from '../lib/useMountEffect'
import { BrandingPanel } from './BrandingPanel'
import { DocumentPage } from './DocumentPage'
import { PrintPreviewDialog } from './PrintPreviewDialog'
import { TemplateGallery } from './TemplateGallery'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

/**
 * Render bench shell (Phase-3 surface, NOT the Phase-4 builder): brand header +
 * 320px left rail (template gallery) + centered gray canvas rendering the
 * shared DocumentPage on a soft shadow.
 *
 * Data source (D-11): the ?fixture= harness path renders the whitelisted model
 * directly (T-01-01, byte-identical behavior); otherwise the empty store is
 * seeded once with the English Minimal demo and that seeded document renders.
 * Optional template/pageSize come from the ?template= / ?size= whitelist
 * (routes/index.tsx, security V5) and flow straight into DocumentPage's
 * resolver — unknown values degrade to undefined → 'minimal' / 'a4' (D-09).
 *
 * Template switch (D-10): the gallery sets the bench's template state and
 * re-renders DocumentPage with the SAME branding object — resolveTokens
 * re-derives unset branding from the new template's defaults and preserves
 * set overrides by construction (partial merge, unit-pinned in plan 02). The
 * branding object is never cleared on switch.
 *
 * Screen-only chrome — .app-shell is hidden under print via print.css
 * (visibility), #print-root's box-shadow is neutralized there, and the rail +
 * header use Tailwind print:hidden (display:none) so they occupy no layout
 * space in print; nothing in this file touches the print projection.
 */
export function RenderBench({
  model: fixtureModel,
  template,
  pageSize,
}: {
  model?: DocumentModel
  template?: TemplateId
  pageSize?: PageSize
}) {
  // Harness path (T-01-01): whitelisted fixture model — render immediately,
  // template-switch stays in-memory (no persistence on the harness path).
  if (fixtureModel !== undefined) {
    return <BenchShell model={fixtureModel} template={template} pageSize={pageSize} />
  }
  // Demo path (D-11): mount the async seed/load only when actually needed.
  return <DemoDocument pageSize={pageSize} />
}

/**
 * The bench chrome around the A4 page block: 320px left rail (card-styled)
 * holding the template gallery, center canvas with the live document.
 *
 * Print-neutrality contract (no print.css change): the header and the rail
 * must not occupy layout space in print — .app-shell's own rules neutralize
 * only the shell, so in-flow chrome above/left of #print-root would push the
 * document and shift PDF pagination (parity break, measured 0.068 vs 0.05 on
 * page 1). `print:hidden` / `print:min-h-0` / `print:pb-0` (Tailwind print:
 * variants) take the chrome out of the printed flow without editing
 * src/styles/print.css — #print-root's subtree is untouched.
 */
function BenchShell({
  model,
  template,
  pageSize,
  onTemplateChange,
  onBrandingChange,
  onLogoChange,
}: {
  model: DocumentModel
  template?: TemplateId
  pageSize?: PageSize
  onTemplateChange?: (template: TemplateId) => void
  onBrandingChange?: (branding: Partial<Branding> | undefined) => void
  onLogoChange?: (logo: string | null) => void
}) {
  // D-10: the template is bench state; branding lives on the model and is
  // passed through untouched on switch (never cleared). The demo path wires
  // onTemplateChange/onBrandingChange/onLogoChange to write the choice back
  // per-document; the harness path leaves them undefined (stateless — parity
  // captures #print-root only).
  const [currentTemplate, setCurrentTemplate] = useState<TemplateId | undefined>(template ?? model.template)

  // PDF-01/02 (plan 03-05): page size is bench state too — default 'a4'
  // (PDF-01), initialized from the route ?size= whitelist / model.pageSize
  // when present. Changes apply instantly (WYSIWYG) to the canvas block.
  const [currentPageSize, setCurrentPageSize] = useState<PageSize>(pageSize ?? model.pageSize ?? 'a4')

  // BUIL-10: the print-preview dialog trigger (bench header primary CTA).
  const [previewOpen, setPreviewOpen] = useState(false)

  const selectTemplate = (id: TemplateId) => {
    setCurrentTemplate(id)
    onTemplateChange?.(id)
  }

  return (
    <div className="flex min-h-screen flex-col print:min-h-0">
      <header className="flex h-12 shrink-0 items-center justify-between px-4 print:hidden">
        <span className="text-base font-semibold tracking-tight">Paperchaser</span>
        <div className="flex items-center gap-2">
          <Select
            value={currentPageSize}
            onValueChange={(next) => {
              if (next !== null && (next === 'a4' || next === 'a5' || next === 'a3')) setCurrentPageSize(next)
            }}
          >
            <SelectTrigger size="sm" aria-label="Page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAGE_SIZES).map(([id, size]) => (
                <SelectItem key={id} value={id}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setPreviewOpen(true)}>Print preview</Button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden print:min-h-0">
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-foreground/10 bg-card p-3 print:hidden">
          <h2 className="mb-3 px-1 text-sm font-semibold">Templates</h2>
          <TemplateGallery selected={currentTemplate ?? 'minimal'} onSelect={selectTemplate} />
          <div className="mt-6">
            {/* D-01: branding lives on the document (model.branding + company.logo)
                — the panel patches the same object DocumentPage reads and the demo
                path persists via documentsRepo.put (BrandingPanel). */}
            <BrandingPanel
              model={model}
              template={currentTemplate ?? 'minimal'}
              onBrandingChange={onBrandingChange}
              onLogoChange={onLogoChange}
            />
          </div>
        </aside>
        <div className="flex flex-1 justify-center overflow-auto px-6 pb-10 print:pb-0">
          <div style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}>
            <DocumentPage
              model={model}
              template={currentTemplate}
              branding={model.branding}
              pageSize={currentPageSize}
            />
          </div>
        </div>
      </main>

      {/* BUIL-10: measure-and-slice print preview (D-15) — the dialog slices
          the SAME DocumentPage instance the canvas renders. */}
      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        model={model}
        template={currentTemplate}
        branding={model.branding}
        pageSize={currentPageSize}
      />
    </div>
  )
}

/** Empty-store load: seed the demo once, then render it through DocumentPage. */
function DemoDocument({ pageSize }: { pageSize?: PageSize }) {
  const [model, setModel] = useState<DocumentModel | null>(null)

  useMountEffect(() => {
    void (async () => {
      await documentsRepo.seedDemoIfEmpty()
      setModel((await documentsRepo.get(DEMO_DOCUMENT_ID)) ?? null)
    })()
  })

  if (model === null) return <div className="flex min-h-screen items-center justify-center" />

  // D-10 per-document persistence: the gallery switch writes the new template
  // back through the repos seam (plan 03-01) so the choice survives reload.
  // Branding is spread through unchanged — set overrides are never cleared.
  const handleTemplateChange = (template: TemplateId) => {
    const next = { ...model, template }
    setModel(next)
    void documentsRepo.put(next)
  }

  // D-01 per-document branding persistence: every panel control patches the
  // SAME branding object DocumentPage renders and writes it back via
  // documentsRepo.put (the panel and the renderer read one object).
  const handleBrandingChange = (branding: Partial<Branding> | undefined) => {
    const next = { ...model }
    if (branding === undefined) delete next.branding
    else next.branding = branding
    setModel(next)
    void documentsRepo.put(next)
  }

  // D-03: the logo lives on company.logo (one source of truth) — the panel
  // never touches a branding.logo field.
  const handleLogoChange = (logo: string | null) => {
    const next = { ...model, company: { ...model.company, logo } }
    setModel(next)
    void documentsRepo.put(next)
  }

  return (
    <BenchShell
      model={model}
      pageSize={pageSize}
      onTemplateChange={handleTemplateChange}
      onBrandingChange={handleBrandingChange}
      onLogoChange={handleLogoChange}
    />
  )
}
