# Stack Research

**Domain:** Frontend-first, local-first invoice/quote/receipt document workspace (browser-only, no backend, no accounts)
**Researched:** 2026-08-07
**Confidence:** HIGH for versions/compatibility (npm registry + official docs, fetched today); MEDIUM-HIGH for architecture judgment (reasoned from primary sources)

## Headline Verdict

**Drop TanStack Start. Use Vite SPA + TanStack Router.** The PRD pins TanStack Start, but it is a Release Candidate full-stack SSR framework whose own docs recommend against it for apps that don't need server features — and Paperchaser's entire premise is "no backend, no accounts, no server." This is the single most important correction to the PRD stack, and it should be validated in the Phase 1 spike. **The PDF engine is the other open decision:** the WYSIWYG canvas must be HTML either way; recommend print-CSS as the primary PDF path (preview/output parity by construction), with @react-pdf/renderer kept as the evaluated fallback for deterministic cross-browser output. The Phase 1 spike decides.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vite | 8.2.1 | Build tool / dev server | Standard for browser-only SPAs. Instant HMR, Rollup-class production build, ecosystem default for shadcn/ui, Tailwind v4, vite-plugin-pwa, TanStack Router. No server runtime required — deploy as static files. |
| React | 19.2.8 | UI framework | Current major; react-pdf, dnd-kit, Zustand, TanStack Form/Router all declare React 19 peers. Required for the whole chosen ecosystem. |
| TypeScript | 7.0.2 | Language | Current major (native compiler). Type-safe document model is the backbone of the app; use strict mode. If template tooling lags TS 7, pin to the latest 5.x the Vite/React template scaffolds. |
| TanStack Router | 1.170.22 | SPA router | Keeps the TanStack ecosystem the PRD wanted (TanStack Start is built 100% on Router) without the server. Type-safe routes, search params, file-based routing optional. Its own docs: "if you know with certainty that you will not need [SSR/server features], consider TanStack Router alone." |
| Tailwind CSS | 4.3.3 | Styling | Current major; v4 is CSS-first (no `tailwind.config.js` by default) via `@tailwindcss/vite`. Standard pairing with shadcn/ui. `@media print` support is essential for the print-CSS PDF path. |
| shadcn/ui | latest (CLI) | Component system | The standard React component system in 2026. Open-code distribution means components live in your repo and are editable — right for a highly customized builder UI. Has a documented TanStack Form + Zod integration. |
| @tanstack/react-form | 1.33.3 | Forms | Native Standard Schema support — pass Zod schemas directly to validators. Field-level async validators with built-in debounce, perfect for line-item validation. |
| Zod | 4.4.3 | Validation | Current major. Shared schemas double as runtime validation + TypeScript types for the document model (profile, customers, line items, totals math). |
| Zustand | 5.0.14 | Client state | The standard lightweight state store. No Provider tree, selector-based subscriptions. Holds editor/draft/UI state; Dexie is the persistent source of truth (write-through). |
| Dexie | 4.4.4 | IndexedDB wrapper | The standard, battle-tested IndexedDB library. Schema versioning + migrations, bulk CRUD, live queries. All tables: profile, customers, catalog, documents, preferences. |
| dexie-react-hooks | 4.4.0 | Reactive DB reads | `useLiveQuery` binds Dexie tables to React components — the dashboard "recent documents" list re-renders on data change with zero manual sync. |
| @dnd-kit/core / @dnd-kit/sortable | 6.3.1 / 10.0.0 | Drag-and-drop | The standard React DnD library. SortableContext for line-item and section-layer reordering; touch sensors for mobile-first builder. |
| @react-pdf/renderer | 4.5.1 | PDF generation (fallback path) | Evaluated in Phase 1 spike. React 19 peer confirmed. Deterministic PDF output regardless of browser. If the spike keeps it, it is the PDF renderer; print-CSS is the primary path. See PDF section. |
| vite-plugin-pwa | 1.3.0 | PWA / offline | Zero-config PWA: Workbox service worker, offline support, web app manifest, icon generation from a single source image. Vite 8 peer confirmed. |
| @hugeicons/react | 1.1.9 | Icons | PRD pins HugeIcons; verified on npm, React 16+ peer. Drop-in icon set for shadcn/ui-styled components. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react-swc | 4.3.3 | React integration for Vite | Default choice: faster dev builds, no extra peers. Supports Vite 8. |
| dexie-export-import | ^4.x | JSON backup/restore | Workspace backup/restore requirement. Or hand-roll export of all tables — both are simple; decide in phase planning. |
| clsx + tailwind-merge | latest | Class composition | Installed automatically by shadcn/ui (needed by `cn()` helper). |
| lucide-react | 1.30.0 | Fallback icons | shadcn/ui defaults to lucide; keep only if HugeIcons lacks a needed glyph. Do not install both for the same UI. |
| @types/node | latest | Node types for vite.config.ts | Required by shadcn Vite setup (path alias resolution). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager | shadcn/ui, Vite, and TanStack docs all show pnpm first; fast, strict peer resolution. |
| shadcn CLI (`pnpm dlx shadcn@latest init -t vite`) | Scaffold component system | The official Vite path; scaffolds project + components.json + Tailwind v4 wiring. |
| ESLint + typescript-eslint | Linting | Vite template default; keep. |
| Vitest + @testing-library/react | Testing | Not installed yet — phase-planning decision; stack is compatible. |
| Git + GitHub | Version control | Greenfield; init in phase 1. |

## Installation

```bash
# Scaffold
pnpm create vite@latest . --template react-ts
pnpm install

# Core
pnpm add react react-dom zustand dexie dexie-react-hooks @tanstack/react-router @tanstack/react-form zod @dnd-kit/core @dnd-kit/sortable @hugeicons/react
pnpm add -D tailwindcss @tailwindcss/vite @vitejs/plugin-react-swc vite-plugin-pwa dexie-export-import

# UI
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label card select dialog sheet drawer textarea table tabs dropdown-menu toast sidebar

# PDF (spike-evaluated; keep optional until spike decides)
pnpm add @react-pdf/renderer
```

## The Two Decision Points (prescriptive)

### 1. TanStack Start vs Vite SPA → Vite SPA, definitively

- TanStack Start is **Release Candidate** status and requires a Node ≥22.12 server runtime (`@rsbuild/core` peer, server functions, streaming, SSR). Its hello-world tutorial reads/writes `node:fs`. Paperchaser has **no server, no accounts, no SSR, no SEO requirement** (authless local app).
- TanStack Start's own overview says: if you know you don't need SSR/server features, use TanStack Router alone. That is exactly this case.
- Cost of ignoring this: a server runtime for a static app, RC-stage churn, `routeTree.gen.ts` codegen, and deploy complexity — all for features explicitly out of scope.
- **Recommendation:** Vite 8 SPA + TanStack Router 1.x. Same TanStack family, same type-safe routing the PRD wanted, zero server. Deployable as static files on any host; works from `file://`-adjacent static hosting for the local-first story.
- Risk: this overrides a PRD pin. Mitigation: the PRD's own "Keep PRD stack" decision is marked Pending and the PRD says stack must be validated in the Phase 1 spike. Do the swap as a spike decision with an ADR.

### 2. PDF engine → print-CSS primary, @react-pdf/renderer as evaluated fallback

The hard requirement is "PDF output identical to on-screen preview" (PRD §6.9) at editing speed. Map the options:

| Approach | Preview/PDF parity | Editing performance | Cross-browser determinism | Verdict |
|----------|-------------------|--------------------|--------------------------|---------|
| **CSS print** (`@page` + `@media print`, browser Save-as-PDF / react-to-print) | **By construction** — the preview DOM IS the printed DOM, same engine | Perfect — pagination happens at print time, nothing regenerates on keystroke | Medium — Chrome/Firefox solid; Safari weaker on paged-media details (thead repetition, mm-level @page control) | **Primary path** |
| **@react-pdf/renderer** | Must be maintained manually — PDF is a *second* render implementation of the document model; `PDFViewer` shows the PDF, not the HTML canvas you edit | Poor for live editing — PDF (re)generation is expensive (pdfkit layout + font embedding); must debounce | **High** — identical bytes in every browser, fonts embedded, precise pagination control (wrap/break/fixed headers/footers) | **Fallback / spike candidate** |
| html2canvas + jsPDF | Rasterizes DOM to bitmap — text not selectable, blurry at print DPI, large files | N/A | N/A | **Reject** |
| jsPDF manual drawing | None | N/A | N/A | **Reject** — too low-level for complex invoice layouts |
| Puppeteer / Playwright | Perfect (headless Chrome) | N/A | High | **Reject** — requires a server runtime; violates no-backend |
| react-to-print | Same as CSS print (it wraps `window.print()`) | Same | Same | Fine as a thin wrapper; not a separate option |

**Recommendation:** Build the WYSIWYG canvas as HTML (required regardless — the three-pane builder edits the DOM). Make that same HTML the print document via `@media print` + `@page` CSS: preview/output parity is then guaranteed by construction at zero cost and zero keystroke latency. **Do not build a react-pdf renderer unless the Phase 1 spike proves print CSS insufficient** — the deciding criteria are (a) Safari paged-media fidelity for repeating table headers and mm-level margins, and (b) whether watermark/Draft-badge positioning per page is achievable in print CSS. If the spike keeps react-pdf, the document model must be renderer-agnostic from day one (a serialized JSON document consumed by both the HTML canvas and the react-pdf tree) — so design the model as pure data regardless. Document model as pure serializable data is a non-negotiable architectural constraint under BOTH paths.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite 8 SPA | TanStack Start (PRD pin) | Only if the product later gains server features (auth, sync, shared docs). Migrating SPA→Start is possible later; building SPA-with-server-framework now is pure overhead. |
| TanStack Router | react-router-dom 7.18.2 | If team prefers react-router's larger familiarity base. TanStack Router chosen to honor the PRD's TanStack direction and for type-safe routes. |
| Tailwind v4 CSS-first | Tailwind v3 (tailwind.config.js) | Never — v3 is legacy. Only relevant if a dependency pins v3. |
| @vitejs/plugin-react-swc | @vitejs/plugin-react 6.0.5 | If you want the canonical Babel-based plugin. Note: v6 now peers on `@rolldown/plugin-babel` + `babel-plugin-react-compiler` — heavier install; swc is faster and dependency-light. |
| Print-CSS primary | @react-pdf/renderer primary | If the spike shows Safari paged-media is unacceptable and deterministic PDF bytes matter more than editing latency. |
| Zustand | Redux Toolkit / Jotai | Zustand is the standard for this app class: no boilerplate, selector-based, fits the "Dexie as truth, Zustand as working copy" split. |
| Dexie | raw IndexedDB / idb | Raw IndexedDB is a footgun; `idb` lacks Dexie's schema versioning and live queries. Dexie is the standard. |
| TanStack Form | react-hook-form + @hookform/resolvers | Both fine; PRD pins TanStack Form and it has native Standard Schema (Zod 4) support — one less adapter. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| TanStack Start | RC-stage full-stack SSR framework; requires Node server runtime, server functions, streaming — all out of scope; its own docs recommend against it for SPAs | Vite 8 SPA + TanStack Router |
| html2canvas | Stalled project (1.4.1 for years); rasterizes to bitmap — non-selectable text, blurry print, bloated files; unprofessional output for invoices | CSS print, or react-pdf if spike decides |
| jsPDF manual layout | Low-level imperative drawing; rewriting a table layout engine for invoices is days of work and unmaintainable | CSS print / react-pdf |
| Puppeteer / Playwright | Needs a Node server runtime — violates no-backend, no-accounts constraint | CSS print (client-side) |
| @tanstack/zod-form-adapter | **Pinned to Zod ^3.x** (peer dep verified) — incompatible with Zod 4. This is a live trap in tutorials. | TanStack Form's native Standard Schema support: pass `z.object()` directly to `validators` |
| react-query (@tanstack/react-query) | There is no server to query. Would duplicate Dexie's live-query role and add cache-invalidation machinery for zero benefit | dexie-react-hooks `useLiveQuery` |
| TipTap / ProseMirror / rich-text editors | A structured document builder (header fields, line-item table, totals) is edited with inputs/selects/textareas, not a rich-text editor. Rich-text editors fight structured models. | Plain form controls + structured section components |
| Tailwind v3 | Legacy config model | Tailwind v4 (CSS-first, @tailwindcss/vite) |
| money.js / finance format libs | Currency formatting is native: `Intl.NumberFormat` | Native browser API |
| Redux Toolkit | Boilerplate overhead for local-first app state | Zustand |

## Stack Patterns by Variant

**If the Phase 1 spike keeps @react-pdf/renderer:**
- The document model must serialize to plain JSON that drives BOTH the HTML canvas and the react-pdf `<Document>` tree. Never render the PDF from DOM.
- Debounce/throttle PDF regeneration (e.g., regenerate on save/export and on a trailing-edge timer during edits, not per keystroke).
- Register fonts once (`Font.register`) and use the same font files the HTML canvas uses, to minimize glyph-metric drift.

**If the Phase 1 spike keeps print-CSS (recommended):**
- The WYSIWYG canvas is rendered in an A4-width container; `@media print` hides app chrome, sets `@page { size: A4; margin: Xmm }`, and uses `page-break-inside: avoid` on line-item rows and section blocks.
- Set `-webkit-print-color-adjust: exact` for logos, colors, and watermarks.
- Keep react-to-print (3.3.0, React 19 peer `~19` confirmed) only if you want a `window.print()` button with React ergonomics; otherwise `window.print()` suffices.

**If deploying as a static PWA:**
- vite-plugin-pwa with `registerType: 'autoUpdate'`, `navigateFallback` for the SPA shell, and `workbox` runtime caching. Generate icons via the plugin's `@vite-pwa/assets-generator` from one source image.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite@8.2.1 | @tailwindcss/vite@4.3.3, @vitejs/plugin-react-swc@4.3.3, vite-plugin-pwa@1.3.0, @tanstack/react-start@1.x | All peers verified against Vite ^8 from npm registry |
| @vitejs/plugin-react@6.0.5 | vite@^8.0.0 | Requires `@rolldown/plugin-babel` + `babel-plugin-react-compiler` peers — heavier alternative to swc |
| react@19.2.8 | @react-pdf/renderer@4.5.1, @dnd-kit/sortable@10.0.0, @tanstack/react-form@1.33.3, zustand@5.0.14, react-to-print@3.3.0, @hugeicons/react@1.1.9, dexie-react-hooks@4.4.0 | All declare React 19-compatible peers (verified) |
| dexie-react-hooks@4.4.0 | dexie >=4.2 <5 | Verified peer range; matches dexie@4.4.4 |
| @dnd-kit/sortable@10.0.0 | @dnd-kit/core ^6.3.0 | Verified peer; install core@6.3.1 |
| zod@4.4.3 | @tanstack/react-form@1.33.3 | Via Standard Schema — **not** via @tanstack/zod-form-adapter (that adapter is Zod ^3 only) |
| tailwindcss@4.3.3 | @tailwindcss/vite@4.3.3, vite ^5.2 \|\| ^6 \|\| ^7 \|\| ^8 | CSS-first config; shadcn/ui v4-compatible |

## Sources

- npm registry (`registry.npmjs.org/<pkg>/latest`) — exact versions and peerDependencies for all packages above, fetched 2026-08-07 (HIGH confidence; primary source)
- TanStack Start Overview & Build-from-Scratch docs — RC status, SSR-only model, Node ≥22.12 requirement, "use Router alone for SPAs" guidance (HIGH; official docs)
- TanStack Form validation docs — native Standard Schema support, debounced async validators (HIGH; official docs)
- react-pdf README (GitHub) — primitives, PDFViewer, browser+node rendering; npm peer data (HIGH for facts; MEDIUM for layout-limitation inference)
- shadcn/ui Vite installation docs — Tailwind v4 + `@tailwindcss/vite` wiring, `shadcn init -t vite` (HIGH; official docs)
- vite-plugin-pwa README — Workbox offline support, assets generator, framework-agnostic (HIGH; official docs)
- PDF-parity analysis (print-CSS vs react-pdf vs rasterize vs headless) — derived from primary source mechanics + ecosystem knowledge (MEDIUM-HIGH; the deciding spike will confirm)

---
*Stack research for: Paperchaser — frontend-first local-first invoice/quote/receipt workspace*
*Researched: 2026-08-07*
