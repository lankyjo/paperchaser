# Phase 3: Render Pipeline — Research

**Researched:** 2026-08-08
**Domain:** Print-CSS rendering, template token registry, golden-image parity, paginated print preview
**Confidence:** HIGH (stack/architecture verified in-repo and against official docs; slicing technique is practitioner-pattern)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Branding persistence model
- **D-01:** Branding lives **per-document** on the model. Each document stores its own optional branding (colors, fonts, header/footer style, watermark override). New documents start from template defaults. Matches the UI-SPEC model fields.
- **D-02:** Unset branding fields resolve to the **active template's defaults**. The template is the base; branding only overrides what is explicitly set.
- **D-03:** **No separate `branding.logo` field** — the renderer reuses the existing `company.logo` (data: URL only, T-02-02) for the header logo. One source of truth.
- **D-04:** Watermark color follows the **brand accent** (or template primary when accent unset). The 64px/rotate(-30°)/opacity 0.15 overlay geometry stays fixed.

#### Fixture language migration
- **D-05:** Translate the German fixture content (invoice-torture, invoice-simple) to **English in-place** — same fixture ids, same shape, English content — then regenerate the committed golden baseline via `UPDATE_BASELINES=1`. One language set, single-pass harness.
- **D-06:** Parity spec loops the torture fixture × **all 7 templates** (7 preview goldens + PDF page comparisons). Every template is proven parity-clean (PDF-06).
- **D-07:** Golden baselines are **A4-only** (harness geometry contract). A5/A3 pagination is verified via structure/pagination assertions through the existing ≥2-page torture path — no per-size golden images.

#### Default template & back-compat
- **D-08:** **Minimal** is the default template for new documents and the empty-store seeded demo.
- **D-09:** `template`, `branding`, `pageSize` are **OPTIONAL** schema fields. A missing template resolves to Minimal at render time. Existing stored documents render immediately with **no Dexie migration** (TEMP-03: structure never changes).
- **D-10:** Switching a document's template re-resolves **unset** branding from the NEW template's defaults; explicitly-set branding overrides survive the switch.
- **D-11:** The render bench **seeds a demo document** (English, Minimal) when the documents store is empty on load. The `?fixture=` route stays for parity tests.

#### Template engine architecture
- **D-12:** Templates are a **data-driven token registry** — each template is a plain TS token object (palette, fonts, borders, spacing, header/footer, table, totals — mirroring the UI-SPEC identity tables). Adding a template = adding a token file. DocumentPage stays template-agnostic.
- **D-13:** Resolved tokens + branding overrides surface as **CSS custom properties** on `#print-root` (`--tpl-primary`, `--tpl-ink`, `--tpl-font-body`, ...). DocumentPage's stylesheet reads the variables; the print projection inherits automatically.
- **D-14:** Template+branding→token resolution lives in a **pure resolver** in `src/document/` (no React/DOM) — Node-unit-testable like totals.ts, preserving the "domain layer is pure" pattern.
- **D-15:** Print preview (BUIL-10) renders page blocks by **measure-and-slice** — render the document into a hidden measure container, slice by computed page-height offsets, render each slice as its own page block in the dialog. Same DOM, one truth, "Page 1 of N" counter.

### the agent's Discretion
No "you decide" answers were given this session — all areas were locked by explicit choice.

### Deferred Ideas (OUT OF SCOPE)
- **PDF download (PDF-07) and browser print surface (PDF-08)** — belong to Phase 6 (validation & shipping); Phase 3 print preview covers the on-screen pagination surface (BUIL-10) and `window.print()` only.
- **Company-profile-level branding defaults** — rejected for this phase: branding is per-document (D-01); a shared profile-level branding object with per-doc override is a Phase 5 concern if the reference-data phase needs it.
</user_constraints>

## Summary

Phase 3 proves the product's core promise: the same DOM renders identically on screen, in print, and in the rasterized PDF, controlled by seven data-driven style templates plus per-document branding. The architecture is fully constrained by CONTEXT.md D-01..D-15 and the APPROVED UI-SPEC: a pure token resolver in `src/document/` (Node-testable, mirroring `totals.ts`), resolved tokens surfaced as `--tpl-*` CSS custom properties on `#print-root` (D-13), three template-agnostic header/footer layout presets, and the existing golden-image harness extended to loop torture × 7 templates (D-06). No new layout engine, no new runtime framework — the print-CSS path (ADR 0002) is extended, not replaced.

**Primary recommendation:** Refactor `DocumentPage` into a prop-driven component (`model`, `template`, `branding`, `pageSize` → resolver → CSS vars + 3×3 layout presets), add the token registry + resolver as pure modules in `src/document/`, wire the render-bench route, and extend `tests/parity.spec.ts` to loop all 7 templates (7 committed A4 goldens, D-07) plus A5/A3 structural assertions. Install exactly two new npm packages (`@fontsource-variable/geist-mono`, `@fontsource-variable/source-serif-4` — both 5.3.0, verified on the registry, same fontsource train as the installed Geist). Everything else — shadcn Select/Dialog/Switch from the official registry, native color/file/radio inputs — rides on already-installed dependencies.

Three verified constraints drive the page-size and preview design: (1) `@page` in Chromium supports **only** `size`/`margin`/`page-orientation` descriptors — colors, fonts, and CSS custom properties do not work inside `@page` at all (MDN); (2) Playwright `page.pdf({ format })` lets the format win over CSS `@page` size by default (`preferCSSPageSize` flips it — installed playwright-core 1.62.1 typings); (3) Chromium does **not** repeat a single absolutely-positioned element (watermark) across paginated PDF pages — the ADR 0002 first-page-only limitation stays, so the print-preview dialog's per-slice watermarks and the PDF's page-1-only watermark are a documented, accepted divergence the harness already tolerates. Page-size switching therefore uses **named `@page` rules** (`@page a5 { size: A5; margin: 0 }` + the inherited `page` property on `#print-root`), never CSS variables in `@page`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Template + branding → token resolution | API / domain layer (pure `src/document/`) | — | D-14: no React/DOM/Dexie; Node-unit-testable like `totals.ts`; consumed by renderer and tests |
| Token → CSS application | Browser / Client | — | D-13: `--tpl-*` custom properties on `#print-root`; DocumentPage reads variables |
| Page geometry, pagination, PDF | Browser / Client (Chromium print pipeline) | Test harness | ADR 0002: print-CSS primary path; `page.pdf()` + rasterization verify |
| Golden parity verification | Test tier (Playwright + pixelmatch) | — | D-06/D-07: 7 templates × torture, A4-only goldens, A5/A3 structural assertions |
| Page-size paper selection | Browser / Client (named `@page` rules) | Harness `format` param | `@page` supports only size/margin descriptors; never `var()` in `@page` |
| Print preview pagination | Browser / Client (measure-and-slice, D-15) | Harness slice comparison | Dialog slices == the harness's existing `cropY` print-projection crops |
| App chrome / bench UI | Browser / Client (React + shadcn) | — | Render bench, NOT the Phase-4 builder |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEMP-01 | Template set covers Blank, Minimal, Modern, Corporate, Freelancer, Agency, Creative | Token registry (D-12): 7 token files in `src/document/templates/`; UI-SPEC identity tables are the single source of truth for each template's values |
| TEMP-02 | Templates control typography, colors, borders, spacing, layout style | Resolved tokens → `--tpl-*` vars on `#print-root` (D-13) + 3×3 header/footer layout presets (Standard/Banner/Compact × Minimal/Standard/Detailed) |
| TEMP-03 | Applying a template never changes document structure | Resolver touches style only; `DocumentPage` DOM skeleton (header/customer/table/totals/footer) unchanged; optional schema fields (D-09), no Dexie migration |
| BRND-01 | User can set a logo on the document | D-03: reuse `company.logo` (data: URL only); native file input → data: URL; 48px header chip; size/type validation |
| BRND-02 | Primary brand color | `--tpl-primary` var + `<input type="color">` override in resolver merge |
| BRND-03 | Accent brand color | `--tpl-accent` var; also feeds watermark color (D-04) |
| BRND-04 | User can choose fonts | Geist / Geist Mono / Source Serif 4 — all three bundled unconditionally via @fontsource (page.pdf() font determinism) |
| BRND-05 | Header/footer style | 3 template-agnostic header presets + 3 footer presets selected by resolved token fields |
| BRND-06 | Draft/Paid watermark | Existing `.watermark` overlay; `deriveWatermark()` auto (D-11) + `watermark: 'draft'\|'paid'` branding override; accent-colored (D-04) |
| BRND-07 | PDF always on white page | `#print-root` background `#ffffff` stays (existing pageStyle); `print-color-adjust: exact` already on `#print-root` |
| PDF-01 | PDF defaults to A4 | Existing `@page { size: A4; margin: 0 }` (print.css:17-20); missing `pageSize` → `'a4'` |
| PDF-02 | Optional page sizes | Named `@page a5`/`@page a3` rules + inherited `page` property on `#print-root`; harness `page.pdf({ format: 'A5'\|'A3' })` (format wins by default, playwright-core 1.62.1) |
| PDF-03 | Automatic pagination | Chromium print pipeline + `thead { display: table-header-group }` + `tr { break-inside: avoid }` (print.css:66-74); torture ≥2-page path |
| PDF-04 | High resolution | Playwright `page.pdf()` vector output; rasterization only in the harness at 794px A4@96dpi |
| PDF-05 | Respects print margins | 15mm via page-block padding + `@page margin: 0` (harness-measured, ADR 0002; do not double-offset) |
| PDF-06 | PDF identical to on-screen preview | Parity by construction (one DOM) + harness: preview vs print 0.0000; print vs PDF per page within calibrated 0.05/0.06 fractions; extended to 7 templates (D-06) |
| BUIL-10 | Open print preview from builder | Dialog with measure-and-slice page blocks (D-15), "Page 1 of N", Print → `window.print()` / Close |
</phase_requirements>
## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource-variable/geist-mono` | 5.3.0 (pinned) | Geist Mono variable font — Agency mono labels, mono branding font option | Fontsource is the installed distribution mechanism (geist 5.3.0 already in `package.json` deps); offline-bundled, never CDN (UI-SPEC Decision 2) |
| `@fontsource-variable/source-serif-4` | 5.3.0 (pinned) | Source Serif 4 variable font — Corporate/Creative serif headings | Same fontsource train; the only two new npm installs this phase |
| shadcn `select` / `dialog` / `switch` | from official registry (components.json `registries` is `{}` — zero third-party) | Bench controls (page size, fonts, header/footer, watermark) + print-preview dialog | Generated into `src/components/ui/` by the shadcn CLI; backed by already-installed `@base-ui/react ^1.7.0` — no new runtime dep |
| Native `<input type="color">`, `<input type="file">`, radio group | — | Branding colors (BRND-02/03), logo upload (BRND-01), watermark (BRND-06) | UI-SPEC Registry Safety: prefer native controls where they exist; no color-picker/upload component |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` 4.4.3 (installed) | optional `template`/`branding`/`pageSize` fields + enums in `types.ts` | D-09 schema extension; enum validation for all new fields | Schema-first model is the source of truth (Phase 2 pattern) |
| `vitest` 4.1.10 (installed) | resolver unit tests | Pure-domain Node tests, colocated `src/document/__tests__/*.test.ts` | Mirror `totals.test.ts` pattern; `pnpm test:unit` |
| `@playwright/test` 1.62.1 + `pixelmatch` 7.2.0 + `pdfjs-dist` 6.2.108 (legacy) + `@napi-rs/canvas` (all installed) | parity harness extension | Golden diffs, PDF rasterization | Extend `tests/parity.spec.ts` + `tests/helpers/raster.ts` — do NOT add new diff tooling (STATE.md mini-spike concern already resolved: pixelmatch is installed and calibrated) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource-variable/*` (bundled) | Google Fonts CDN links | Offline-first violation; PWA offline breaks; CDN fetch on print |
| Named `@page` rules + `page` property | CSS `var()` inside `@page`, or JS-driven `page.pdf()` width/height only | `var()` in `@page` is unsupported (page context takes only size/margin/orientation descriptors — MDN); format-only works for the harness but leaves `window.print()` with the wrong paper size for A5/A3 |
| Offset-translate slicing (D-15) | New pagination library (paged.js, react-paged) | The slice geometry is exactly what the harness already diffs (`cropY`); a library adds a second pagination engine that fights the parity contract |
| pixelmatch (installed) | Playwright `toHaveScreenshot()` | Existing harness is calibrated (0.3 threshold, band assertions); `toHaveScreenshot` brings per-run flakiness and no band-analysis seam |

**Installation:**
```bash
pnpm add @fontsource-variable/geist-mono@5.3.0 @fontsource-variable/source-serif-4@5.3.0
```

**Version verification (run this session):**
- `npm view @fontsource-variable/geist-mono version` → `5.3.0` (published 2026-07-19; created 2024-12-29)
- `npm view @fontsource-variable/source-serif-4 version` → `5.3.0` (published 2026-07-19; created 2023-05-21, 128k weekly downloads)
- Both have `postinstall: null` (no scripts) and the fontsource/font-files source repo — same publisher as the installed `@fontsource-variable/geist`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@fontsource-variable/geist-mono` | npm | 1.6 yrs (pkg), version 5.3.0 published 2026-07-19 | unknown weekly (registry hides) | github.com/fontsource/font-files | [SUS] — seam flags too-new version + unknown-downloads | Flagged — keep, planner adds `checkpoint:human-verify`; same publisher/train as installed `@fontsource-variable/geist` 5.3.0, no postinstall |
| `@fontsource-variable/source-serif-4` | npm | 3.2 yrs (pkg), version 5.3.0 published 2026-07-19 | 128,038/wk | github.com/fontsource/font-files | [SUS] — seam flags too-new version | Flagged — keep, planner adds `checkpoint:human-verify`; no postinstall, established package |
| shadcn `select`/`dialog`/`switch` | shadcn official registry | n/a (generated) | n/a | shadcn/ui official | [OK] | Approved — `components.json` `registries` is `{}`, official registry only; deps already installed (`@base-ui/react ^1.7.0`) |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@fontsource-variable/geist-mono`, `@fontsource-variable/source-serif-4` — both carry inline `[WARNING: flagged as suspicious — verify before using.]`; the planner must insert `checkpoint:human-verify` before each install. Mitigating evidence recorded in the audit table: identical publisher and version train to the already-installed, already-green `@fontsource-variable/geist@5.3.0`, zero postinstall scripts, and 128k weekly downloads on source-serif-4. The SUS flag is driven by the seam's "too-new version publish" signal (5.3.0 published 2026-07-19), not by provenance.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────── Render Bench (new route) ───────────────────────────────┐
│  Bench header [Page size ▾] [Print preview ▾]        (shadcn Select / Button)          │
│  Left rail 320px: template gallery (7) + branding controls + page size                  │
│  Center canvas: A4/A5/A3 page block (white, 15mm padding, soft shadow)                  │
└───────────────┬───────────────────────────────────────────────────────────────────────┘
                │ model + template + branding + pageSize props
                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ DocumentPage (src/components/DocumentPage.tsx — prop-driven refactor, D-12/D-13)       │
│   templateId ──► resolveTokens(template, branding) ──► --tpl-* CSS vars on #print-root │
│   (pure, src/document/ — D-14)                    ┌─ headerStyle: standard|banner|compact│
│   pageSize ──► #print-root class (.page-a5) ────► ┤─ footerStyle: minimal|standard|detailed
│   model ──► computeTotals / deriveWatermark ──────┘  + watermark overlay (accent color) │
└───────────────┬─────────────────────────────┬──────────────────────────────────────────┘
                │ one DOM                      │ one DOM
                ▼                              ▼
┌───────────────────────────┐      ┌─────────────────────────────────────────┐
│ SCREEN (bench canvas)     │      │ PRINT / PDF (src/styles/print.css)      │
│ #print-root, 210/148/297mm│      │ @page { size: A4|A5|A3; margin: 0 }      │
│ width, min-height 297mm   │      │ visibility-hide .app-shell, thead repeat │
│ (element screenshot)      │      │ tr break-inside:avoid                    │
└───────────────┬───────────┘      │ page.pdf({format}) = real PDF            │
                │                   └───────────────────┬─────────────────────┘
                ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PARITY HARNESS (tests/parity.spec.ts + tests/helpers/raster.ts)             │
│ 7 templates × torture fixture: preview-golden diff, preview-vs-print (0.01), │
│ print-vs-PDF per page (0.05 / 0.06 + break-shift), watermark/logo bands     │
│ (blend computed from resolved accent — D-04), A5/A3 structural assertions   │
└─────────────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ PRINT PREVIEW DIALOG (BUIL-10)│
│ measure-and-slice (D-15): N   │
│ page blocks = full doc         │
│ translateY(-i·pageH) per page  │
│ "Page i of N", Print/Close     │
└───────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── components/
│   ├── DocumentPage.tsx          # refactor: props {model, template?, branding?, pageSize?}
│   ├── print/
│   │   ├── HeaderStandard.tsx    # 3 template-agnostic header layout presets (BRND-05)
│   │   ├── HeaderBanner.tsx
│   │   ├── HeaderCompact.tsx
│   │   ├── FooterMinimal.tsx     # 3 footer presets
│   │   ├── FooterStandard.tsx
│   │   └── FooterDetailed.tsx
│   └── bench/                    # render-bench chrome (replaces index route content)
│       ├── RenderBench.tsx       # header + rail + canvas layout
│       ├── TemplateGallery.tsx   # 7 cards, 3 swatch dots, active ring + check
│       ├── BrandingPanel.tsx     # logo/colors/fonts/header/footer/watermark controls
│       └── PrintPreviewDialog.tsx# measure-and-slice page stack (D-15)
├── document/                     # pure domain — no React/DOM/Dexie
│   ├── tokens.ts                 # token types: TemplateTokens, ResolvedTokens, PAGE_SIZES
│   ├── resolveTokens.ts          # D-14 pure resolver: template + branding → resolved → CSS vars
│   ├── templates/
│   │   ├── blank.ts              # 7 token files (D-12: adding a template = adding a file)
│   │   ├── minimal.ts
│   │   ├── modern.ts
│   │   ├── corporate.ts
│   │   ├── freelancer.ts
│   │   ├── agency.ts
│   │   └── creative.ts
│   ├── types.ts                  # + optional template/branding/pageSize fields (D-09, zod)
│   ├── fixtures.ts               # English in-place translation (D-05); + template/pageSize fields
│   └── __tests__/
│       └── tokens.test.ts        # resolver unit tests (vitest, colocated pattern)
├── styles/
│   ├── index.css                 # + 2 @fontsource-variable imports (unconditional)
│   └── print.css                 # + @page a5 / @page a3 named rules + .page-a5/.page-a3
tests/
├── parity.spec.ts                # extended: loop 7 templates, A5/A3 assertions, dialog check
├── helpers/
│   └── raster.ts                 # + blendColor(hex, opacity, bg) helper for D-04 watermark band
└── fixtures/
    └── invoice-torture.{template}.preview.png   # 7 committed A4 goldens (D-06/D-07)
```

### Pattern 1: Data-Driven Token Registry + Pure Resolver (D-12/D-14)

**What:** Each template is a plain TS object mirroring its UI-SPEC identity table; a pure function merges template tokens with per-document branding overrides (D-02) and returns (a) a `ResolvedTokens` object and (b) the `--tpl-*` custom-property map applied to `#print-root`.
**When to use:** Every template/branding path — bench preview, print, PDF, print-preview dialog, and the harness all consume the same resolved tokens.
**Structure:** `types.ts` schema: `template: z.enum(['blank','minimal','modern','corporate','freelancer','agency','creative']).optional()`, `branding: z.object({ primaryColor, accentColor, headingFont, bodyFont, headerStyle, footerStyle, watermark }).partial().optional()` (UI-SPEC model fields), `pageSize: z.enum(['a4','a5','a3']).optional()`. Resolver contract: `resolveTokens(template: TemplateId, branding?: Branding, model?: DocumentModel): { tokens: ResolvedTokens; vars: Record<string,string>; pageSize: PageSize }` — the `vars` map is spread as inline style on `#print-root` (cast through `as CSSProperties` — React's CSSProperties has no `--*` index signature), so the print projection inherits them automatically (same element, D-13).
**Hard rule:** the resolver must be a pure function with no React/DOM/Dexie imports — Node-unit-testable. `pageSize` joins the resolution here (`'a4'` default, PDF-01) so back-compat (D-09) lives in one place.

### Pattern 2: Page-Size Switching via Named `@page` Rules (PDF-01/02, D-07)

**What:** Three named page rules plus a size class on `#print-root`; the inherited `page` property selects the paper. `@page` takes only size/margin/orientation descriptors — never `var()`.
**When to use:** A5/A3 selection (window.print() path) and harness `page.pdf()` (format param path). A4 stays the unnamed default so existing calibrated behavior is untouched.
**Example:**
```css
@page { size: A4; margin: 0 }          /* existing, unchanged — default */
@page a5 { size: A5; margin: 0 }       /* named pages: @page <name> { ... } + page property (MDN) */
@page a3 { size: A3; margin: 0 }
#print-root.page-a5 { page: a5 }       /* page is inherited → all pages of the doc */
#print-root.page-a3 { page: a3 }
```
Harness side: `page.pdf({ format: 'A5', printBackground: true })` — `format` takes priority over width/height and defaults to 'Letter'; `preferCSSPageSize` (default false) would flip priority to CSS `@page` (playwright-core@1.62.1 types.d.ts:4023-4025,4090-4097). Both mechanisms agree here, so no flag needed. A4 goldens stay A4-only (D-07); A5/A3 get structural assertions only.

### Pattern 3: Measure-and-Slice Print Preview (D-15, BUIL-10)

**What:** Render the full document once in a hidden measure container at the selected page width. `sliceCount = max(1, ceil(measureHeight / pageHeightPx))`; render `sliceCount` page blocks, each `width: pageWidth; height: pageHeight; overflow: hidden`, each containing the same full document translated by `translateY(-i * pageHeight)`.
**When to use:** The print-preview dialog page stack. The slice geometry is byte-identical to the harness's existing `cropY(printShot, i * A4_HEIGHT_PX, A4_HEIGHT_PX)` comparison inputs (parity.spec.ts:144,158-163), so the dialog is verifiable with the already-calibrated constants — dialog page i ≈ PDF page i within 0.05/0.06 (transitive through the print projection).
**Caveat (accepted):** continuous-flow slice boundaries can differ from Chromium's real pagination when `break-inside: avoid` pushes a row — the harness absorbs exactly this with the bounded break-shift search (`MAX_BREAK_SHIFT_PX = 100`). Assert dialog page count == PDF numPages on the torture fixture (measured stable at 2), and compare dialog slices at pixel level with existing tolerances; do not assert exact slice contents.

### Anti-Patterns to Avoid

- **Per-template CSS classes or per-template JSX branches:** D-12's whole point — one template-agnostic renderer. A branch on `templateId` inside DocumentPage is the smell that a token field is missing.
- **CSS variables inside `@page`:** unsupported (page context takes only size/margin/orientation); page size belongs in named `@page` rules with static sizes.
- **New elements outside `#print-root` for template decoration:** anything outside `#print-root` is hidden in print by the `visibility` contract (print.css:50-57) and breaks the element-box capture the harness uses. Bands/decorations go inside `#print-root` (child divs or `::before`/`::after` pseudo-elements — both render inside the element box and survive `page.pdf()`).
- **Conditional font imports per template:** `page.pdf()` must never swap fonts mid-capture; import all three fontsource packages unconditionally in `index.css`.
- **Re-deriving totals or watermark in the renderer:** `computeTotals`/`deriveWatermark` remain the single engines (Phase 2 pattern); the resolver consumes them, never reimplements.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | A second layout engine (react-pdf tree, html2pdf, puppeteer-on-demand) | Browser print pipeline + `page.pdf()` (ADR 0002) | Parity by construction; react-pdf regenerates the full PDF per change and needs a second renderer kept in sync forever (ADR 0002 evidence) |
| Paginated preview | A pagination library (paged.js etc.) | Offset-translate slicing (D-15) on the existing DOM | A library is a second fragmentation engine whose output must match Chromium's — the slice geometry already matches the harness's crop inputs |
| Golden-image diffing | New snapshot tooling | pixelmatch 7.2.0 + existing band analysis (raster.ts) | Installed and calibrated (0.3 threshold, WATERMARK/LOGO/THEAD bands); STATE.md's "diff tooling mini-spike" concern is already resolved by the committed implementation |
| Font bundling | Self-hosting raw WOFF2 files or CDN links | `@fontsource-variable/*` packages | Standard, offline-first, variable fonts; same train as installed Geist |
| Color picking / file upload / watermark radio | Custom picker/upload components | `<input type="color">`, `<input type="file" accept="image/png,image/jpeg,image/svg+xml">`, native radio | UI-SPEC Registry Safety; zero new deps, native behavior (constrained hex, no invalid states) |
| CSS page-size switching | JS-driven `@page` injection or `var()` in `@page` | Named `@page` rules + `page` property | `@page` supports only size/margin/orientation descriptors (MDN); named pages are Baseline 2024 |

**Key insight:** this phase's entire risk surface is *"anything that renders differently in print than on screen."* Every custom mechanism (a new paginator, a new diff tool, a new PDF renderer) re-opens that gap; every reused mechanism (one DOM, print.css, pixelmatch, named `@page`) closes it.
## Runtime State Inventory

> Phase 3 includes a fixture-content migration (D-05) and a golden-baseline regeneration (D-06) — not a rename, but the same "what still carries the old value after the repo is updated?" audit applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Dexie `documents` table may hold Phase-2-era records **without** `template`/`branding`/`pageSize` | Code edit only, **no data migration**: D-09 optional schema fields + render-time defaults (`template`→minimal, `pageSize`→a4, branding→template defaults). Dexie `version(2)` stays untouched (db.ts:17-25). Verify with a zod-parse of a stored doc lacking the new keys |
| Live service config | None — no external services (offline-first SPA, no backend) | None ("None — verified: no service config exists; ADR 0001 rejects any server tier") |
| OS-registered state | None — dev-machine only, no schedulers/daemons registered | None |
| Secrets/env vars | None new; `UPDATE_BASELINES=1` is an existing local-only env flag (CI never sets it — parity.spec.ts:209-216, workflow) | None — flag behavior unchanged; the regenerated goldens are committed artifacts (D-05/D-06) |
| Build artifacts | Committed golden `tests/fixtures/invoice-torture.preview.png` (German content) | Regenerated/renamed as 7 template goldens `invoice-torture.{template}.preview.png` via local `UPDATE_BASELINES=1` (D-05/D-06). Also: fixture translation changes `src/document/fixtures.ts` (English, same ids/shape), `tests/artifacts/` is scratch (gitignored), `dist/` rebuilds normally |

**Canonical question:** after every source file is updated, what still holds the old value? Answer: the committed German golden baseline and any stored Dexie documents — the golden is regenerated (D-05), stored documents render via render-time defaults with zero migration (D-09).

## Common Pitfalls

### Pitfall 1: Hardcoded watermark/log band colors break when the watermark becomes accent-colored (D-04)
**What goes wrong:** The harness asserts the watermark band against a hardcoded blend of `#1d4ed8` (`WATERMARK_BLEND` at parity.spec.ts:61-63). With D-04 the watermark color follows the brand accent (or template primary), so 6 of 7 templates fail the band assertion.
**Why it happens:** The calibration predates branding; the blend target is a constant.
**How to avoid:** Add a `blendColor(hex, opacity, background)` helper to `tests/helpers/raster.ts` that computes `(color * alpha + bg * (1-alpha))` per channel; each template's band target is derived at runtime from its **resolved** accent (same resolver the app uses — import `resolveTokens` into the spec). The logo color (`#1d4ed8` in the fixture's SVG mark) stays constant — `LOGO_COLOR` unchanged.
**Warning signs:** template-specific failures in the watermark test for exactly the templates whose accent ≠ `#1d4ed8`.

### Pitfall 2: CSS `var()` inside `@page` or custom properties for page size
**What goes wrong:** `@page { size: var(--page) }` silently fails — the page context takes only `size`/`margin`/`page-orientation` descriptors, and the remaining page properties (color, background, font) are supported by **no** user agent (MDN @page).
**Why it happens:** The page box is not an element; it does not inherit element-level custom properties.
**How to avoid:** Named `@page a5/a3` rules with static sizes + the inherited `page` property on `#print-root` (Pattern 2). `--tpl-*` vars stay on elements inside the page box, where they work in both projections.
**Warning signs:** A5/A3 prints come out A4, or page.pdf output ignores the CSS size.

### Pitfall 3: Golden regeneration is a one-shot, easily repeated incorrectly
**What goes wrong:** Someone runs the whole suite with `UPDATE_BASELINES=1`, regenerating goldens while the renderer is mid-refactor — committing wrong baselines that "pass" forever (the blank-baseline guard only catches blank images, not wrong ones).
**Why it happens:** `test:update` is `UPDATE_BASELINES=1 playwright test ... -g baseline` — the flag is global.
**How to avoid:** Keep the committed-only rule (CI never writes — existing workflow). Regenerate once, per template, **after** each template's tokens and fixtures are final and the preview-vs-print test is green; review the diff artifacts before committing. Baseline sanity guards (width 794px, `nonWhiteFraction > 0.01`) already run on every commit.
**Warning signs:** A golden changed in the same commit as token changes that weren't reviewed.

### Pitfall 4: Fonts not loaded when `page.pdf()` captures
**What goes wrong:** A template using Source Serif 4 or Geist Mono renders in a fallback font in the PDF while the screen shows the real font — the print-vs-PDF diff fraction blows past 0.06 (a *different* font is content drift, not AA noise).
**Why it happens:** Fonts load via `@font-face` swap; `page.pdf()` can capture before the webfont finishes.
**How to avoid:** Import all three fontsource packages unconditionally in `index.css` (never per-template), and await `document.fonts.ready` in the harness's `captureFixture` before screenshots/PDF (one line, deterministic; the existing Geist path already benefits).
**Warning signs:** Print-vs-PDF failures that name a specific template whose fonts differ from Geist.

### Pitfall 5: Preview-dialog slices diverging from real pagination at row boundaries
**What goes wrong:** A continuous-flow slice can cut a line-item row that Chromium's real paginator pushes to the next page (`break-inside: avoid`) — the dialog's page N content differs from PDF page N by a row.
**Why it happens:** The dialog slices a continuous projection; the PDF uses paged-media fragmentation.
**How to avoid:** Accept and calibrate, don't "fix" by reimplementing fragmentation: reuse the harness's existing bounded break-shift search (`MAX_BREAK_SHIFT_PX = 100`) when comparing dialog slices to PDF pages, and assert page-count equality (`dialog blocks == pdf numPages`) on the torture fixture where the count is stable at 2.
**Warning signs:** A one-row offset between the dialog stack and the printed PDF on exactly one template.

### Pitfall 6: Template decoration escaping `#print-root`
**What goes wrong:** A band/decor element mounted outside `#print-root` (e.g., in the bench layout) is hidden in print by the `body * { visibility: hidden }` contract (print.css:50-57) and is absent from the element-box screenshot — screen shows it, PDF doesn't.
**Why it happens:** The print visibility rule hides everything except `#print-root` and its subtree.
**How to avoid:** All document decoration (bands, chips, rules) lives inside `#print-root` — child elements or `::before`/`::after` pseudo-elements of `#print-root` itself (both render inside the element box and survive `page.pdf()`). Bench chrome stays in `.app-shell`, where it belongs.
**Warning signs:** Preview-vs-print diff > 0.01 on a specific template; the diff image shows decoration present on one side only.

### Pitfall 7: de-DE currency formatting vs English copy
**What goes wrong:** English fixture content formatted `1.234,56 €` (de-DE) reads wrong in the English bench demo; "fixing" it mid-phase moves the calibrated document base.
**Why it happens:** `Intl.NumberFormat('de-DE', ...)` is hardcoded in DocumentPage (line 15).
**How to avoid:** Keep the de-DE formatter this phase — locale-aware formatting is MONEY-01 (v2), and the golden regeneration cost is identical either way but the risk of base-drift is not zero. Flag to the discuss-phase/user for explicit confirmation (Open Question 1).
**Warning signs:** A "number format looks wrong" note in review that expands scope into a locale registry.

## Code Examples

Verified patterns from official sources and this repo:

### Named-page size switching (Chromium print + window.print)
```css
/* print.css — @page takes only size/margin/page-orientation (MDN @page) */
@page { size: A4; margin: 0 }            /* existing default — unchanged */
@page a5 { size: A5; margin: 0 }
@page a3 { size: A3; margin: 0 }
#print-root.page-a5 { page: a5 }         /* `page` is inherited (MDN) */
#print-root.page-a3 { page: a3 }
```
```typescript
// page.pdf(): format takes priority over width/height, defaults 'Letter';
// preferCSSPageSize (default false) flips priority to CSS @page
// (playwright-core@1.62.1 types.d.ts:4023-4025, 4090-4097).
const pdf = await page.pdf({ format: 'A5', printBackground: true })
```

### Resolver → CSS variables on #print-root (D-13/D-14)
```typescript
// src/document/resolveTokens.ts — PURE module (no React/DOM/Dexie, Node-testable)
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
```tsx
// src/components/DocumentPage.tsx — the shared render component
const vars = toCssVars(resolved)                      // { '--tpl-primary': '#1e3a5f', ... }
return (
  <div
    id="print-root"
    className={pageSize === 'a4' ? undefined : `page-${pageSize}`}
    style={{ ...pageStyle, ...(vars as CSSProperties) }}   // React CSSProperties lacks --* keys
  >
    {/* watermark color: resolved.palette.accent (D-04) — className .watermark keeps geometry */}
    <div className="watermark" aria-hidden="true" style={{ color: resolved.palette.accent }}>
      {watermarkText}
    </div>
    <HeaderPreset style={resolved.header.style} tokens={resolved} model={model} />
    {/* customer section, table, totals unchanged structurally (TEMP-03) */}
    <FooterPreset style={resolved.footer.style} tokens={resolved} model={model} />
  </div>
)
```

### Measure-and-slice (D-15) — dialog page stack
```tsx
// PrintPreviewDialog.tsx — sliceCount from the measured continuous element
const pageH = pageBlockRef.current?.offsetHeight ?? 1123   // A4@96dpi ≈ 1123px
const totalH = measureRef.current?.offsetHeight ?? pageH
const sliceCount = Math.max(1, Math.ceil(totalH / pageH))
// render: N blocks, each width: pageW, height: pageH, overflow: 'hidden',
// inner div style={{ transform: `translateY(${-i * pageH}px)` }} containing the SAME DocumentPage
```
```typescript
// Harness check (parity.spec.ts): dialog slice i == the crop the harness already diffs
// against PDF page i within the calibrated 0.05/0.06 fractions (parity.spec.ts:144-163).
```

### Accent-blend watermark band target (D-04)
```typescript
// tests/helpers/raster.ts — derive the expected blend, don't hardcode it
export function blendColor(hex: string, alpha: number, bg: RGB): RGB {
  const c = parseInt(hex.slice(1), 16)
  const fg = { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255 }
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
  }
}
// usage: WATERMARK_BLEND = blendColor(resolvedAccent, 0.15, { r: 255, g: 255, b: 255 })
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-template CSS classes / stylesheet variants | Data-driven token registry + CSS custom properties (D-12/D-13) | This phase | Adding a template = adding a token file; renderer stays template-agnostic; resolver unit-testable |
| Fixed A4 page geometry (Phase 1/2 harness contract) | Named `@page` rules + `page` property for A5/A3 (PDF-02) | This phase | Same print pipeline, new paper sizes; goldens stay A4-only (D-07) |
| Hardcoded `#1d4ed8` watermark/logo colors | Resolved accent-colored watermark (D-04) + blend-derived band targets | This phase | Watermark follows branding; harness assertions become derived, not hardcoded |
| German fixture content + single golden | English fixtures (D-05) + 7 template goldens (D-06) | This phase | One language, one harness pass; every template parity-proven (PDF-06) |

**Deprecated/outdated:**
- `page.pdf()`'s `preferCSSPageSize` stays **false** (default) — don't enable it: `format` winning keeps the harness's format-driven paper size and the CSS named page matching it deterministic.
- Don't reintroduce a second PDF engine — react-pdf 4.5.1 remains the documented fallback ONLY on Safari 18.2+ manual-acceptance failure (ADR 0002), not a Phase-3 option.
## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Offset-translate slicing (D-15) reproduces the harness's `cropY` print-projection slices pixel-for-pixel, so dialog pages can be verified with existing 0.05/0.06 tolerances | Architecture Patterns / Pitfall 5 | If the dialog render path differs (e.g., a wrapper changes layout), dialog-vs-PDF diff fails; mitigation: assert page-count equality + reuse break-shift search, and gate the dialog comparison as its own test |
| A2 | Named `@page` rules + the `page` property work in the harness Chromium build (Baseline 2024; Chromium supports named pages since 85) | Pattern 2 | If the installed Chromium lacks `page` support, A5/A3 print size falls back to A4; quick manual `window.print()` check at implementation time |
| A3 | shadcn `select`/`dialog`/`switch` generate Base UI components with **no** new npm dependency beyond installed `@base-ui/react ^1.7.0` | Standard Stack | If a shadcn add pulls an unexpected dep, the legitimacy gate must re-run for it |
| A4 | Keeping the de-DE currency formatter (`1.234,56 €`) for English fixture/demo content is acceptable this phase; locale formatting is MONEY-01 (v2) | Pitfall 7 / Open Question 1 | If the user wants English formatting now, the formatter changes and goldens regenerate (same one-shot cost) |
| A5 | `@fontsource-variable/geist-mono` and `@fontsource-variable/source-serif-4` import paths (`@fontsource-variable/<name>`) and default `font-display: swap` match the installed `geist` convention | Standard Stack | Wrong import name fails the build loudly (Vite resolves at build); low risk |
| A6 | STATE.md's "golden-image diff tooling mini-spike" blocker is already resolved by the committed pixelmatch implementation | Don't Hand-Roll | If a re-spike were required it would stall planning; it is not — pixelmatch is installed, calibrated, green |

## Open Questions

1. **Currency formatting under English content (de-DE `1.234,56 €` vs `€1,234.56`)?**
   - What we know: `Intl.NumberFormat('de-DE', …)` is hardcoded in `DocumentPage.tsx:15`; fixtures are being translated to English (D-05) and goldens regenerated anyway; MONEY-01 (locale-aware formatting) is deferred to v2.
   - What's unclear: whether the English bench should also switch the number locale (scope bump: a locale registry, not just a constant swap).
   - Recommendation: keep de-DE this phase (zero risk to the calibrated document base); confirm with the user in the discuss-phase; if changed, it's a one-line formatter swap + one regeneration, still inside this phase's baseline workflow.

2. **`page` property acceptance on the harness Chromium?**
   - What we know: Baseline 2024 (Dec 2024), Chromium has supported named pages since 85; the installed browsers are 1228/1234 trains (2026).
   - What's unclear: nothing material — but the A5/A3 path has no golden to prove it, only structural assertions.
   - Recommendation: add a tiny smoke assertion to the A5/A3 test that the PDF page **width** equals the A5/A3 format (rasterize and check `pages[0].width` ≈ 794·(148/210) for A5), proving the format param actually took effect.

3. **Watermark on pages ≥ 2 (ADR 0002 first-page-only limitation) in the print-preview dialog?**
   - What we know: the dialog's offset-sliced pages each contain the full document, so the watermark element appears in slice 0 only (same as the print projection and the harness crops); the real PDF also carries it page-1-only (ADR 0002 measured 0 pixels on pages ≥ 2).
   - What's unclear: whether a future builder should repeat the watermark per page (ADR 0002 explicitly defers per-page repetition to when the builder has real page structure — Phase 4+).
   - Recommendation: accept page-1-only for Phase 3; do not add per-page watermark repetition.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, vitest, Playwright harness | ✓ | v24.12.0 | CI pins node 24 (workflow `node-version: 24`) — match |
| pnpm | install/lockfile | ✓ | 11.20.0 | `--frozen-lockfile` in CI |
| Chromium (Playwright) | parity harness (`page.pdf` is Chromium-only) | ✓ | browsers chromium-1228/1234 + headless shells installed | — |
| @napi-rs/canvas | pdfjs-dist Node rasterization (harness) | ✓ | ^1.0.3 installed | — |
| Safari 18.2+ | ADR 0002 manual acceptance (paged-media fidelity) | ✗ | — | PENDING manual step — does NOT block Phase 3 (documented in ADR 0002) |
| External services/network | none — offline-first SPA | ✓ (n/a) | — | — |

**Missing dependencies with no fallback:**
- None for this phase's implementation; the only missing item (Safari 18.2+ for manual acceptance) is a pre-existing ADR 0002 gate that stays pending and does not block.

**Missing dependencies with fallback:**
- None new.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.10 (unit) + @playwright/test 1.62.1 (e2e/parity) |
| Config file | none for vitest — scoped in `vite.config.ts:36-45` (`include: ['src/**/*.test.ts']`, `passWithNoTests: true`); `playwright.config.ts` (tests/ dir, Chromium only, DPR 1, prod build via `vite preview` on :4173) |
| Quick run command | `pnpm exec vitest run src/document/__tests__/tokens.test.ts` |
| Full suite command | `pnpm test:unit && pnpm test` (unit + parity; CI order: lint → typecheck → test:unit → build → test) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEMP-01/02 | 7 templates produce distinct token sets; resolver merges branding over template defaults (D-02/D-12) | unit | `pnpm exec vitest run src/document/__tests__/tokens.test.ts` | ❌ Wave 0 |
| TEMP-03 | Structure invariance: same DOM skeleton across all 7 templates (DOM-shape assertion) | unit | `tokens.test.ts` + parity (below) | ❌ Wave 0 |
| TEMP-02/BRND-01..06 | Preview renders template+branding correctly | e2e (parity) | `pnpm test` — per-template preview goldens | ❌ extended in Wave 0 |
| D-09/D-10 | Missing template → minimal; template switch re-resolves unset branding; set overrides survive | unit | `tokens.test.ts` | ❌ Wave 0 |
| PDF-01/02 | A4 default; A5/A3 paper size + pagination ≥2 pages + thead strip + watermark band | e2e (parity, structural) | `pnpm test` — A5/A3 test in parity.spec.ts | ❌ Wave 0 |
| PDF-06/BRND-07 | preview == print == PDF, white page, per template | e2e (golden + diff) | `pnpm test` — 7-template loop in parity.spec.ts | ❌ extended in Wave 0 |
| D-04 | Watermark color follows resolved accent (blend-derived band) | e2e (band) | `pnpm test` — blend target from `resolveTokens` | ❌ Wave 0 |
| BUIL-10 | Dialog page count == PDF numPages (torture, stable 2); slices diff within calibrated tolerance | e2e (parity) | `pnpm test` — dialog check in parity.spec.ts | ❌ Wave 0 |
| D-05/D-06 | English fixtures; 7 committed goldens regenerated by `UPDATE_BASELINES=1` (local-only) | baseline | `pnpm test:update` (local, reviewed); CI never writes | ✅ harness exists; goldens to regenerate |

### Sampling Rate
- **Per task commit:** `pnpm exec vitest run src/document/__tests__/tokens.test.ts` (or the touched test file) + `pnpm typecheck`
- **Per wave merge:** `pnpm test:unit && pnpm lint && pnpm typecheck && pnpm build && pnpm test` (mirrors CI gates)
- **Phase gate:** full CI gate green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/document/__tests__/tokens.test.ts` — covers TEMP-01/02/03, D-02/D-09/D-10, PDF-01 defaults
- [ ] `tests/parity.spec.ts` — extend to loop 7 templates (per-template goldens + print/PDF comparisons), A5/A3 structural tests, dialog page-count test, blend-derived watermark target
- [ ] `tests/helpers/raster.ts` — add `blendColor(hex, alpha, bg)` helper
- [ ] Fixture translation (D-05) + goldens regeneration (D-06) — content change, not a new file
- [ ] `captureFixture` — add `await page.evaluate(() => document.fonts.ready)` (robustness, Pitfall 4)

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts — offline-first SPA (REQUIREMENTS.md out-of-scope table; ADR 0001) |
| V3 Session Management | no | None exists |
| V4 Access Control | no | Single local user |
| V5 Input Validation | **yes** | Zod enums for `template`/`branding`/`pageSize` (schema is source of truth); `?template=`/`?size=` query params whitelist-validated against the registry like the existing `?fixture=` guard (routes/index.tsx:14-18); logo file type/size gate (PNG/JPG/SVG ≤ 2 MB) before `FileReader.readAsDataURL` |
| V6 Cryptography | no | No secrets, no transport (all local) — data: URL images only, no external fetches |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SVG data: URL in `<img src>` | Tampering | Scripts do NOT execute in `<img>` image context (SVG-in-img is inert); schema already enforces data: URL only via `logoSchema` refine (types.ts:49-54, T-02-02-LOGO) — no http(s) remote fetch on render |
| Raw query-string reflection | Spoofing | Existing whitelist pattern (routes/index.tsx) extends to `template`/`size` params; never JSON-parse raw query strings |
| Stored XSS via document content | Tampering | React text nodes escape by default; raw-HTML injection banned project-wide (grep-enforced in CI, DocumentPage.tsx:10-13); branding strings render as text/vars, never innerHTML |
| Logo size/type abuse | DoS | Size gate at read time (≤ 2 MB), not render; rejected file → inline error, no state change (UI-SPEC error copy) |
| `print-color-adjust` / watermark leakage | Info disclosure | n/a — watermark is `aria-hidden` decoration (existing); no sensitive data in print beyond the document itself |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: repo, this session] — `src/components/DocumentPage.tsx` (15mm/210×297mm geometry, de-DE formatter at line 15), `src/styles/print.css` (@page A4 margin 0, watermark, visibility contract, thead repeat, break-inside), `src/document/types.ts` (schema; z.object strips unknown keys; logoSchema data: URL refine at 49-54), `src/document/totals.ts` (pure-engine pattern), `src/document/fixtures.ts` (German content), `src/db/repos.ts` (repos/seams), `tests/parity.spec.ts` (calibration constants 0.01/0.05/0.06, bands, UPDATE_BASELINES), `tests/helpers/raster.ts` (A4 794/1123, normalize/cropY/rasterizePdf), `playwright.config.ts`, `vite.config.ts` (vitest scope), `.github/workflows/*.yml` (CI gates)
- [VERIFIED: playwright-core@1.62.1 types.d.ts:4023-4025, 4090-4097] — `page.pdf()` `format` priority + `preferCSSPageSize` semantics (installed package, this session)
- [CITED: developer.mozilla.org/en-US/docs/Web/CSS/@page] — @page descriptor support (size/margin/page-orientation only; page properties unsupported by any UA); named pages (`@page <name>` + `page` property); Baseline 2024
- [CITED: docs/adr/0001-framework.md, docs/adr/0002-pdf-path.md] — framework + print-CSS parity-by-construction contract, measured harness evidence, Safari acceptance gate
- [VERIFIED: npm registry, this session] — `@fontsource-variable/geist-mono@5.3.0` (created 2024-12-29), `@fontsource-variable/source-serif-4@5.3.0` (created 2023-05-21, 128k/wk), both `postinstall: null`, fontsource/font-files repo

### Secondary (MEDIUM confidence)
- [CITED: .planning/phases/03-render-pipeline/03-UI-SPEC.md] — approved design contract: template identities, header/footer presets, page-size surface, print-preview surface, copywriting, registry safety
- [CITED: .planning/phases/03-render-pipeline/03-CONTEXT.md] — locked decisions D-01..D-15 (authoritative for this phase)

### Tertiary (LOW confidence)
- [ASSUMED] offset-translate measure-and-slice technique (Pattern 3 / A1) — practitioner pattern; corroborated by the harness's existing `cropY(printShot, i*A4_HEIGHT_PX, …)` geometry in this repo, not by an external authoritative source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — two new packages verified on npm with provenance; everything else already installed (versions read from package.json this session)
- Architecture: HIGH — all patterns derive from locked decisions (D-12..D-15), in-repo geometry contracts, and verified Playwright/MDN facts; the slicing technique itself is the one LOW-confidence element (A1)
- Pitfalls: HIGH — every pitfall is grounded in this repo's harness constants, print.css contract, or ADR 0002 measured evidence

**Research date:** 2026-08-08
**Valid until:** 2026-09-07 (30 days; harness/pinned versions stable, fontsource on a slow release train)

