# Phase 3: Render Pipeline — Pattern Map

**Mapped:** 2026-08-08
**Files analyzed:** 13 (5 modify, 8 new)
**Analogs found:** 13 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/document/types.ts` (modify) | schema/model | CRUD | `src/document/types.ts` (itself — extend) | exact |
| `src/document/tokens.ts` (new) | model/config | transform | `src/document/totals.ts:15-25` (interfaces) + `fixtures.ts` (data objects) | role-match |
| `src/document/templates/*.ts` ×7 (new) | config | static data | `src/document/fixtures.ts:32-111` (plain TS object literals) | exact |
| `src/document/resolve-tokens.ts` (new) | service | transform | `src/document/totals.ts:39-92` (pure function) | exact |
| `src/document/__tests__/tokens.test.ts` (new) | test | — | `src/document/__tests__/totals.test.ts` | exact |
| `src/components/DocumentPage.tsx` (modify) | component | render | itself + RESEARCH Pattern 1 snippet | exact |
| `src/styles/print.css` (modify) | config | static | itself + RESEARCH Pattern 2 (named `@page`) | exact |
| `src/components/RenderBench.tsx` (new) | component | render/request-response | `src/routes/index.tsx` (route entry) + `src/components/ui/button.tsx` (shadcn pattern) | role-match |
| `src/components/PrintPreviewDialog.tsx` (new) | component | render (measure-and-slice) | RESEARCH Pattern 3 + `src/components/ui/*` shadcn | partial (no dialog exists yet) |
| `src/db/repos.ts` (modify) | service | CRUD | itself (add seed to `documentsRepo`) | exact |
| `src/document/fixtures.ts` (modify) | data | static | itself (in-place English translation) | exact |
| `tests/parity.spec.ts` (modify) | test | — | itself (loop templates) | exact |
| `tests/helpers/raster.ts` (modify) | utility | transform | itself (add `blendColor`) | exact |

## Pattern Assignments

### `src/document/types.ts` (schema, modify — add optional template/branding/pageSize, D-09)

**Analog:** itself. The file is the schema source of truth; new fields append to `documentSchema` (types.ts:68-87). Zod 4 syntax: `z.iso.date()` (line 76), `z.int()` (line 28), `z.enum([...] as [string, ...string[]])` (line 74), `z.object().partial().optional()` for branding per RESEARCH §Pattern 1.

**Schema style** (types.ts:68-77):
```typescript
export const documentSchema = z.object({
  // z.object() default STRIPS unknown keys = D-14 (strict-object reject is NOT used)
  id: z.string(),
  type: z.enum(['invoice', 'quote', 'receipt']),
  currency: z.enum(Object.keys(CURRENCY_DECIMALS) as [string, ...string[]]),
  issueDate: z.iso.date(),
  // ... existing fields stay untouched (TEMP-03: no structure change)
})
```

**Add (per RESEARCH §Pattern 1):**
```typescript
// template: z.enum(['blank','minimal','modern','corporate','freelancer','agency','creative']).optional()
// pageSize: z.enum(['a4','a5','a3']).optional()
// branding: z.object({ primaryColor, accentColor, headingFont, bodyFont, headerStyle, footerStyle, watermark }).partial().optional()
```
Re-export the nested `Branding`/`TemplateId`/`PageSize` types at the bottom like existing `LineItem`/`Company`/`Customer` re-exports (types.ts:92-95). No Dexie version bump (D-09, db.ts:16 version(2) untouched).

---

### `src/document/tokens.ts` (new — token types + registry seam)

**Analog:** `src/document/totals.ts:15-37` for interface style; `src/document/fixtures.ts` for data-object style.

**Interface style** (totals.ts:27-37 — pure domain, doc comment pins the "no React/DOM/Dexie" rule):
```typescript
export interface Totals {
  lineNets: number[] // per-line rounded nets (reconciliation: printed line == engine line)
  subtotalMinor: number // D-01: Σ rounded line nets
  // ...
}
```

**Export shape to copy:** `TemplateId` enum-union, `Branding` interface (optional fields, matching the zod `.partial()` shape), `TemplateTokens` (palette/fonts/borders/spacing/header/footer/table/totals per UI-SPEC identity tables), `ResolvedTokens`, `PAGE_SIZES` record. Keep the same header doc-comment convention: "Nothing in this file may depend on React, the DOM, or Dexie — Node-testable by construction" (totals.ts:1-5). The registry (`TEMPLATE_REGISTRY: Record<TemplateId, TemplateTokens>`) maps the 7 template files; `tokens.ts` exports the type + registry map, `templates/*.ts` export the values.

---

### `src/document/templates/*.ts` ×7 (new — blank/minimal/modern/corporate/freelancer/agency/creative)

**Analog:** `src/document/fixtures.ts:32-111` — plain typed TS object literals, one default export each.

**Data-object style** (fixtures.ts:33-51):
```typescript
export const FIXTURE_MAP: Record<string, DocumentModel> = {
  'invoice-torture': {
    id: 'torture-invoice',
    type: 'invoice',
    // ...
  },
}
```
Each template file exports one `TemplateTokens` literal; values come verbatim from 03-UI-SPEC identity tables (the single source of truth per RESEARCH TEMP-01). No logic in these files — data only.

---

### `src/document/resolve-tokens.ts` (new — pure resolver, D-14)

**Analog:** `src/document/totals.ts:39-92` — EXACT. Same module contract: pure function(s), no React/DOM/Dexie imports, doc comment banning them (totals.ts:1-5).

**Pure-function signature style** (totals.ts:39-44):
```typescript
export function computeTotals(doc: {
  currency: string
  lineItems: Array<{ quantity: number; unitPriceMinor: number; taxRateMinor: number; discount?: Discount }>
  discount?: Discount
  shippingFees?: ShippingFee[]
}): Totals {
```

**Resolver contract** (RESEARCH §Pattern 1, code at RESEARCH.md:352-366):
```typescript
export function resolveTokens(
  template: TemplateId,
  branding?: Partial<Branding>,
): ResolvedTokens {
  const base = TEMPLATE_REGISTRY[template]           // token file, D-12
  const resolved: ResolvedTokens = {
    ...base,
    palette: { ...base.palette, ...pick(branding, ['primaryColor', 'accentColor']) },
    fonts: { ...base.fonts, ...pick(branding, ['headingFont', 'bodyFont']) },
    header: { ...base.header, style: branding?.headerStyle ?? base.header.style },
    footer: { ...base.footer, style: branding?.footerStyle ?? base.footer.style },
  }
  return resolved
}
```
Plus: `toCssVars(resolved): Record<string, string>` producing `{ '--tpl-primary': '#1e3a5f', ... }` (D-13), and the `pageSize` default (`'a4'`, PDF-01) — back-compat for missing `template` → `'minimal'` lives here (D-08/D-09). Reuses `deriveWatermark` from totals.ts for the watermark text (BRND-06); never reimplements it (RESEARCH Anti-Pattern 4).

---

### `src/document/__tests__/tokens.test.ts` (new — Wave 0 unit tests)

**Analog:** `src/document/__tests__/totals.test.ts` — EXACT. vitest colocated pattern.

**Structure** (totals.test.ts:1-6, 8-16, 112-139):
```typescript
import { describe, expect, it } from 'vitest'

import { FIXTURE_MAP } from '../fixtures'
import { computeTotals, deriveWatermark } from '../totals'
import { documentSchema } from '../types'

describe('roundMinor — half-away-from-zero ties (A1, Pitfall 2)', () => {
  it('rounds a negative .5 tie AWAY from zero — ...', () => {
    expect(roundMinor(-2.5, 0)).toBe(-3)
  })
})
```
Each `describe` names the decision it pins (`describe('documentSchema — ... (D-15, D-11)')`); assertions document the pinned decision inline in the `it` body. Coverage targets per RESEARCH Validation Architecture: TEMP-01/02 (7 templates distinct tokens), D-02 (branding overrides template defaults), D-09 (missing template → minimal, pageSize → a4), D-10 (switch re-resolves unset, set survives), TEMP-03 (DOM shape — structural only via parity), schema parse of fixtures.

---

### `src/components/DocumentPage.tsx` (modify — prop-driven, token-variable-driven, D-12/D-13)

**Analog:** itself (refactor target). Imports + structure stay; `pageStyle` becomes a base and the hardcoded colors/fonts move to CSS vars.

**Existing imports** (DocumentPage.tsx:1-4):
```typescript
import type { CSSProperties } from 'react'

import { computeTotals, deriveWatermark } from '../document/totals'
import type { DocumentModel } from '../document/types'
```

**New imports to add:** `resolveTokens`/`toCssVars` from `../document/resolve-tokens`, types `TemplateId`/`Branding`/`PageSize`.

**Props + root element** (RESEARCH.md:369-386 — the concrete target):
```tsx
export function DocumentPage({ model, template, branding, pageSize }: {
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize?: PageSize
}) {
  const resolved = resolveTokens(template ?? 'minimal', branding)
  const vars = toCssVars(resolved)                    // { '--tpl-primary': '#1e3a5f', ... }
  const totals = computeTotals(model)
  return (
    <div
      id="print-root"
      className={pageSize === 'a4' ? undefined : `page-${pageSize}`}
      style={{ ...pageStyle, ...(vars as CSSProperties) }}   // React CSSProperties lacks --* keys
    >
      <div className="watermark" aria-hidden="true" style={{ color: resolved.palette.accent }}>
        {watermarkText}
      </div>
      <HeaderPreset style={resolved.header.style} tokens={resolved} model={model} />
      {/* customer section, table, totals unchanged structurally (TEMP-03) */}
      <FooterPreset style={resolved.footer.style} tokens={resolved} model={model} />
    </div>
  )
}
```
**Hard rules:** keep `#print-root` id and the 210mm/15mm geometry in `pageStyle` (lines 21-33); keep the de-DE `Intl.NumberFormat` (DocumentPage.tsx:15 — Research Open Question 1: keep this phase); all new decoration goes INSIDE `#print-root` (children or `::before`/`::after`) — anything outside is hidden in print (RESEARCH Pitfall 6); no `templateId` branches in JSX — missing token field smell (RESEARCH Anti-Pattern 1). Header/footer presets (`src/components/print/Header*.tsx`, `Footer*.tsx` — 3×3) are per RESEARCH structure; existing inline header/footer JSX (lines 48-65, 119-122) becomes the three presets reading `tokens`.

---

### `src/styles/print.css` (modify — token-variable plumbing + named @page)

**Analog:** itself. Existing @page and media rules stay; add named page rules + `.page-a5/.page-a3` classes.

**Existing @page + watermark** (print.css:17-38) — keep, except `.watermark` `color: #1d4ed8` (line 36) becomes accent-driven: either `color: var(--tpl-accent, #1d4ed8)` or leave the color inline in DocumentPage (`style={{ color: resolved.palette.accent }}` per RESEARCH snippet) — pick ONE mechanism; the harness needs the resolved accent to derive the blend target either way (Pitfall 1).

**Add (RESEARCH.md:236-243, Pattern 2 — @page takes only size/margin/orientation, never var()):**
```css
@page { size: A4; margin: 0 }            /* existing, unchanged — default */
@page a5 { size: A5; margin: 0 }         /* named pages: @page <name> { ... } + page property (MDN) */
@page a3 { size: A3; margin: 0 }
#print-root.page-a5 { page: a5 }         /* page is inherited → all pages of the doc */
#print-root.page-a3 { page: a3 }
```
Do NOT touch the `.app-shell` / `body *` visibility contract (print.css:40-64), `thead { display: table-header-group }` (67-69), or `tr { break-inside: avoid }` (72-74).

---

### `src/styles/index.css` (modify — font imports, BRND-04)

**Analog:** itself. Existing fontsource import at index.css:4:
```css
@import "@fontsource-variable/geist";
```
Add, unconditionally (never per-template — RESEARCH Pitfall 4):
```css
@import "@fontsource-variable/geist-mono";
@import "@fontsource-variable/source-serif-4";
```

---

### `src/components/RenderBench.tsx` (new — bench chrome: header + rail + canvas)

**Analog (role):** `src/routes/index.tsx` (current page content being replaced) + `src/components/ui/button.tsx` (shadcn component idiom).

**Route entry pattern to replace** (routes/index.tsx:14-18 — keep the `?fixture=` whitelist guard, D-11):
```typescript
export function IndexPage() {
  const raw = new URLSearchParams(window.location.search).get('fixture')
  const key = raw !== null && FIXTURE_KEYS.has(raw) ? raw : DEFAULT_FIXTURE
  return <DocumentPage model={FIXTURE_MAP[key]} />
}
```
Extend the same whitelist to `?template=`/`?size=` (RESEARCH Security Domain V5 — whitelist-validate against the registry, never JSON-parse raw query strings). The bench adds: empty-store seed via `documentsRepo.get/put` (D-11), header (page-size shadcn Select + print-preview Button), 320px left rail (template gallery + branding panel), center canvas rendering `DocumentPage`.

**shadcn component idiom** (ui/button.tsx:1-5, 43-56 — new Select/Dialog/Switch generated into `src/components/ui/` by the shadcn CLI will follow this same shape):
```typescript
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
```
Use the `@/` path alias, `cn()`, Base UI primitives, `data-slot` on the root. New ui components: `select.tsx`, `dialog.tsx`, `switch.tsx` (shadcn CLI add; `components.json` registries `{}` = official registry only).

---

### `src/components/PrintPreviewDialog.tsx` (new — measure-and-slice, D-15/BUIL-10)

**Analog (partial):** no dialog exists — closest are the ui components for the Dialog shell and the harness's own crop geometry (`tests/parity.spec.ts:144`). The slicing contract comes from RESEARCH Pattern 3.

**Measure-and-slice core** (RESEARCH.md:390-396):
```tsx
const pageH = pageBlockRef.current?.offsetHeight ?? 1123   // A4@96dpi ≈ 1123px
const totalH = measureRef.current?.offsetHeight ?? pageH
const sliceCount = Math.max(1, Math.ceil(totalH / pageH))
// render: N blocks, each width: pageW, height: pageH, overflow: 'hidden',
// inner div style={{ transform: `translateY(${-i * pageH}px)` }} containing the SAME DocumentPage
```
Geometry constants come from `tests/helpers/raster.ts:18-20` (`A4_WIDTH_PX = 794`, `A4_HEIGHT_PX = 1123`) — the dialog's slice i is the same crop the harness diffs against PDF page i (`cropY(printShot, i * A4_HEIGHT_PX, A4_HEIGHT_PX)`, parity.spec.ts:144). "Page i of N" counter + Print (`window.print()`) / Close buttons. Measure container must be hidden but rendered (not `display: none` — offsets are 0) — use an off-screen/`aria-hidden` wrapper. Assert page count == PDF numPages (stable 2 on torture, RESEARCH A1).

---

### `src/db/repos.ts` (modify — demo seed, D-11)

**Analog:** itself. `documentsRepo` (repos.ts:49-55) is the only touchpoint; add an empty-store seed.

**Existing repo idiom** (repos.ts:49-55):
```typescript
export const documentsRepo = {
  put: (doc: DocumentModel) => db.documents.put(doc),
  get: (id: string) => db.documents.get(id),
  delete: (id: string) => db.documents.delete(id),
  byStatus: (status: DocumentModel['status']) => db.documents.where('status').equals(status).toArray(),
}
```
Seed pattern: `get` → if undefined, `put` the Minimal English demo fixture (D-08) — e.g. a `seedDemoIfEmpty()` in `documentsRepo` or a small `seed.ts` seam. Dexie `version(2)` untouched (db.ts:16-22 — D-09 needs no migration). The existing `db/__tests__/repos.test.ts` (fake-indexeddb) is the test analog if the seed gets a unit test.

---

### `src/document/fixtures.ts` (modify — English in-place translation, D-05)

**Analog:** itself. Same fixture ids (`'invoice-torture'`, `'invoice-simple'`), same shape (FIXTURE_MAP keys — routes/index.tsx:4 `FIXTURE_KEYS` and parity.spec.ts:38 `FIXTURE = 'invoice-torture'` depend on them), only content strings → English (titles, descriptions, company/customer names, addresses). `LOGO_DATA_URL` (fixtures.ts:9-17) keeps the #1d4ed8 SVG mark — the harness's `LOGO_COLOR` (parity.spec.ts:75) depends on it. Optionally add `template`/`pageSize` fields per RESEARCH structure; goldens regenerate via `UPDATE_BASELINES=1` (`pnpm test:update`).

---

### `tests/helpers/raster.ts` (modify — blendColor, D-04)

**Analog:** itself. Add one pure helper alongside `countPixelsInRange` (raster.ts:138-165).

**blendColor** (RESEARCH.md:405-415 — exact target):
```typescript
export function blendColor(hex: string, alpha: number, bg: RGB): RGB {
  const c = parseInt(hex.slice(1), 16)
  const fg = { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255 }
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
  }
}
```
Uses the existing `RGB` interface (raster.ts:22-26). Constants `A4_WIDTH_PX`/`A4_HEIGHT_PX` (raster.ts:18-20) also feed the dialog + A5/A3 structural assertions (`794 · (148/210)` for A5 width per RESEARCH Open Question 2).

---

### `tests/parity.spec.ts` (modify — 7-template loop, A5/A3, dialog checks)

**Analog:** itself. Keep all calibration constants (lines 44-87); extend.

**Harness structure to loop** (parity.spec.ts:106-126): `captureFixture(page)` is parameterized by template — add `template` param: `page.goto(/?fixture=invoice-torture&template=${tpl})`, and the existing three captures (preview, print projection, `page.pdf`). Existing geometry reuse: page slices `cropY(printShot, i * A4_HEIGHT_PX, A4_HEIGHT_PX)` (line 144), thead strip `THEAD_STRIP_PX = 26` + bounded break-shift search `MAX_BREAK_SHIFT_PX = 100` (lines 58-59, 158-163), band analysis `countPixelsInRange` (lines 184-204).

**Per-template changes:**
- Goldens: `tests/fixtures/invoice-torture.{template}.preview.png` — loop the baseline test (lines 207-232) over 7 templates; `UPDATE_BASELINES=1` regenerates all; keep the width-794 / nonWhiteFraction sanity guards (lines 225-226).
- Watermark band: replace hardcoded `WATERMARK_BLEND` (line 62) with `blendColor(resolvedAccent, 0.15, white)` where `resolvedAccent` comes from importing `resolveTokens(tpl)` — the same resolver the app uses (Pitfall 1). `LOGO_COLOR` (line 75) stays #1d4ed8.
- Fonts: add `await page.evaluate(() => document.fonts.ready)` inside `captureFixture` before screenshots/PDF (Pitfall 4).
- New tests: A5/A3 structural (PDF page width ≈ `794 · (148/210)` for A5, pagination ≥2, thead strip, watermark band — D-07 says no A5/A3 goldens), dialog page-count == numPages + slice diff within existing tolerances (A1).

## Shared Patterns

### Pure domain layer
**Source:** `src/document/totals.ts:1-10` (header doc-comment ban); enforced by no-React/DOM/Dexie imports.
**Apply to:** `tokens.ts`, `resolve-tokens.ts`, `templates/*.ts`, `types.ts`. Node-testable via vitest (`pnpm exec vitest run src/document/__tests__/tokens.test.ts`).

### Zod schema as source of truth
**Source:** `src/document/types.ts:68-87`; Zod 4 syntax — `z.enum`, `z.iso.date()`, `z.int()`, `.optional()`, `.partial()`. Unknown keys stripped (D-14).
**Apply to:** new `template`/`branding`/`pageSize` fields; `tokens.test.ts` parses fixtures through `documentSchema.safeParse` (totals.test.ts:114-138 pattern).

### CSS custom properties on #print-root (D-13)
**Source:** RESEARCH Pattern 1 — `toCssVars(resolved)` spread as inline style, cast `...(vars as CSSProperties)` (React `CSSProperties` lacks `--*` index signature). Same element → print projection inherits automatically.
**Apply to:** `DocumentPage.tsx` + `print.css` (watermark accent + named pages).

### shadcn component idiom
**Source:** `src/components/ui/button.tsx:1-5` — Base UI primitive wrapper + `cva` + `cn(@/lib/utils)`. New `select`/`dialog`/`switch` generated via shadcn CLI (official registry only, `components.json` `registries` `{}`).
**Apply to:** `RenderBench.tsx` (Select, Switch), `PrintPreviewDialog.tsx` (Dialog).

### Parity calibration constants
**Source:** `tests/helpers/raster.ts:18-20` (794/1123), `tests/parity.spec.ts:44-87` (0.3 threshold, 0.01/0.05/0.06 fractions, THEAD_STRIP_PX 26, MAX_BREAK_SHIFT_PX 100, WATERMARK_FLOOR 500, WATERMARK_RATIO 3, LOGO_FLOOR 1000, THEAD_FLOOR 30).
**Apply to:** all parity tests + the print-preview dialog geometry (slice i == `cropY(printShot, i*A4_HEIGHT_PX, A4_HEIGHT_PX)`).

### Golden baseline regeneration
**Source:** `tests/parity.spec.ts:207-232` + `package.json` `test:update` = `UPDATE_BASELINES=1 playwright test tests/parity.spec.ts -g baseline`. Committed goldens; CI never writes. Regenerate once per template AFTER tokens+fixtures final and preview-vs-print green (Pitfall 3).
**Apply to:** D-05 (English fixtures) + D-06 (7 goldens).

### Whitelist query-param guard
**Source:** `src/routes/index.tsx:14-18` (`?fixture=` checked against `FIXTURE_KEYS` Set, fallback default; never reflect raw strings).
**Apply to:** bench route — extend the same Set-check to `?template=`/`?size=`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/PrintPreviewDialog.tsx` | component | render (measure-and-slice) | No dialog/overlay exists in the codebase; use RESEARCH Pattern 3 (RESEARCH.md:246-250, 388-400) + shadcn `dialog` recipe as the structural base, ui/button.tsx for the idiom |
| `src/document/tokens.ts` / `templates/*` | config | static data | No token-system precedent; type style from totals.ts, data-object style from fixtures.ts |

## Metadata

**Analog search scope:** `src/document/`, `src/components/`, `src/components/ui/`, `src/styles/`, `src/routes/`, `src/db/`, `src/router.ts`, `tests/`, `package.json`
**Files scanned:** 15 existing files read (types, totals, totals.test, fixtures, DocumentPage, print.css, index.css, routes/index, router, __root, db, repos, raster, parity.spec, ui/button)
**Pattern extraction date:** 2026-08-08
