# Phase 1: Foundation Spike - Research

**Researched:** 2026-08-07
**Domain:** Frontend framework decision (Vite SPA vs TanStack Start), PDF output path (print-CSS vs react-pdf), golden-image parity harness, Vite SPA scaffold + CI baseline
**Confidence:** HIGH

## Summary

This phase makes the two gatekeeping decisions for Paperchaser — framework and PDF engine — with decisive evidence, and proves them on a realistic fixture invoice. The prior research in `.planning/research/` (SUMMARY.md, STACK.md, PITFALLS.md, all verified 2026-08-07 against the npm registry and official docs) recommended **Vite SPA + TanStack Router** and **print-CSS primary**; this research confirms both recommendations with current primary-source evidence and adds the decisive facts the ADRs need.

**Framework (ADR 1):** TanStack Start is still **Release Candidate** — its own docs say "considered feature-complete and its API is considered stable. This does not mean it is bug-free or without issues" — and its own overview says: "if you know with certainty that you will not need any of the above features [SSR, streaming, server routes, server functions, middleware, full-stack builds], then you may want to consider using TanStack Router alone." Paperchaser needs none of those features (no backend, no accounts, no SEO, offline-first). The current Router quick-start ships an official SPA scaffold (`@tanstack/cli create --router-only`). **Decision: Vite 8 SPA + TanStack Router 1.170.22.**

**PDF engine (ADR 2):** Print-CSS is the primary path. Decisive facts: (a) Playwright's `page.pdf()` renders the page with `print` CSS media — the same projection the on-screen preview renders — so preview/PDF parity is testable headlessly in CI using the exact print stylesheet; (b) Safari's `@page` support landed only in Safari 18.2 (caniuse: not supported 3.1–18.1, supported 18.2+), and `print-color-adjust` is Baseline 2025 — the Safari criteria from ROADMAP must be verified empirically in this spike on Safari 18.2+, not assumed; (c) react-pdf is a second layout engine (Yoga + pdfkit, Knuth–Plass hyphenation — its own docs confirm these are not browser CSS) that must be kept in sync forever, with the known force-fit pagination bug class and a `render` prop that fires twice. react-pdf is only justified if the spike proves print-CSS cannot meet the criteria; the evidence points the other way. **Decision: print-CSS primary; react-pdf 4.5.1 remains the documented fallback, to be adopted only if the spike's Safari paged-media tests fail.**

**Parity harness:** Playwright Test 1.62.1 (Chromium) + pixelmatch 7.2.0 + pngjs 7.0.0 + pdfjs-dist 6.2.108. The harness renders a fixture document, captures (1) the on-screen preview via `page.screenshot()`, (2) the print projection via `page.emulateMedia({ media: 'print' })` + screenshot, and (3) the actual PDF via `page.pdf({ format: 'A4', printBackground: true })` rasterized through pdfjs-dist — then pixelmatch-diffs preview-vs-PDF per page. This narrows the Phase 3 mini-spike flag from SUMMARY.md ("golden-image tooling choice") to a concrete, already-decided toolchain; only the threshold calibration remains empirical.

**Scaffold critical correction to STACK.md:** the current `create-vite` 9.1.2 react-ts template ships **TypeScript `~6.0.2`, not 7.x** — and this is correct: `typescript-eslint@8.66.0` peers on `typescript: ">=4.8.4 <6.1.0"`, so **TypeScript 7.0.2 (the native compiler, now npm `latest`) is NOT supported by the lint toolchain**. The template also uses **oxlint** (not ESLint) and `@vitejs/plugin-react` 6.0.5 with build = `tsc -b && vite build`. Pin TypeScript to `~6.0.3`. Node v24.12.0 (verified locally) satisfies Vite 8's engines (`^20.19.0 || >=22.12.0`).

**Primary recommendation:** Scaffold with the stock Vite react-ts template, keep its TS 6.0.x + oxlint + `tsc -b` build, add TanStack Router (router-only), Tailwind v4, shadcn/ui, Dexie, vite-plugin-pwa (`registerType: 'prompt'` — the default), Playwright + pixelmatch, and one fixture invoice; the two ADRs record the decisions with the evidence below.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Framework decision (SPA vs SSR) | Frontend Server (SSR) / build | Browser / Client | The decision is "no server tier exists" — Vite SPA means the build tier produces static files only; all rendering is client-side. The ADR documents this as a *removal* of the SSR tier [CITED: tanstack.com Start overview] |
| PDF output path | Browser / Client | API / Backend (rejected) | Print-CSS renders in the browser at print time; no server PDF engine (Puppeteer/Playwright server-side) is used — STACK.md rejects server runtimes outright for the product [CITED: STACK.md:117] |
| Golden-image parity harness | Build / Dev tooling (CI) | Browser / Client | The harness drives a headless Chromium instance from CI; it asserts on both browser projections (preview + print) [CITED: playwright.dev class-page] |
| WYSIWYG preview rendering | Browser / Client | — | The editable canvas is HTML/CSS in the browser; parity-by-construction depends on preview and print sharing one DOM [CITED: STACK.md:88] |
| Offline capability (PWA) | Browser / Client | Build | vite-plugin-pwa generates the service worker at build time; runtime behavior is entirely client-side [CITED: vite-pwa docs] |

<user_constraints>
## User Constraints (from CONTEXT.md)

**No CONTEXT.md exists for this project** — Phase 1 has no locked user decisions beyond the ROADMAP.md success criteria and the prior research recommendations. The prior research (SUMMARY.md, STACK.md, PITFALLS.md) is treated as the consensus baseline the spike must validate or overturn with evidence:

- Framework: research recommends **Vite SPA + TanStack Router** (override of the PRD's TanStack Start pin) — spike decides with ADR, defaulting to Vite SPA.
- PDF path: research recommends **print-CSS primary** with @react-pdf/renderer as evaluated fallback — spike decides on (a) Safari paged-media fidelity, (b) per-page watermark positioning, (c) rendering latency vs editing speed.
- Parity harness: **golden-image screenshot diff** is required before any editing UX is built (STATE.md blocker).
- Blocking: **no other phase starts until this phase passes** (STATE.md).

### Deferred Ideas (OUT OF SCOPE)
None recorded for Phase 1. v2 items (auth, sync, multi-profile, marketplace) and all out-of-scope features are listed in REQUIREMENTS.md and must not leak into the spike.
</user_constraints>

<phase_requirements>
## Phase Requirements

No requirement IDs — Phase 1 is a feasibility spike. The four ROADMAP success criteria are the requirements:

| SC # | Success Criterion | Research Support |
|------|-------------------|------------------|
| 1 | ADR records framework decision (Vite SPA + TanStack Router vs TanStack Start) with deciding evidence | Start RC status + Router-alone guidance [CITED: tanstack.com/start/latest/docs/framework/react/overview]; Router 1.170.22 verified on npm [VERIFIED: npm registry]; SPA scaffold `@tanstack/cli create --router-only` [CITED: tanstack.com/router quick-start] |
| 2 | ADR records PDF path decision (print-CSS primary vs react-pdf) against explicit criteria | Safari `@page` support only 18.2+ [CITED: caniuse.com/css-paged-media]; `print-color-adjust` Baseline 2025 [CITED: MDN]; Playwright `page.pdf()` renders print CSS media headlessly [CITED: playwright.dev]; react-pdf second-engine mechanics [CITED: react-pdf.org/advanced] |
| 3 | Golden-image parity harness proves identical preview/output on fixtures, runs in dev + CI | Playwright 1.62.1 + pixelmatch 7.2.0 + pdfjs-dist 6.2.108 toolchain specified (see Validation Architecture); `page.emulateMedia({media:'print'})` + `page.pdf()` + `page.screenshot()` [CITED: playwright.dev] |
| 4 | Scaffold boots (Vite SPA, TS strict, Tailwind v4, shadcn/ui, TanStack Router, Dexie, vite-plugin-pwa), static deploy, green CI | All versions verified on npm today [VERIFIED: npm registry]; template reality (TS 6.0.x, oxlint, tsc -b) captured [VERIFIED: create-vite template package.json on GitHub]; registerType 'prompt' is the default [CITED: vite-pwa docs] |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.2.1 | Build tool / dev server | Current major (verified npm). Static-file output, no server runtime. Engines `node ^20.19.0 || >=22.12.0` — Node v24.12.0 satisfies [VERIFIED: npm registry] |
| React | 19.2.8 | UI framework | Current major; whole ecosystem declares React 19 peers [VERIFIED: npm registry] |
| TypeScript | ~6.0.3 | Language | **NOT 7.0.2**: typescript-eslint 8.66.0 peers `typescript: ">=4.8.4 <6.1.0"` — TS 7 (native compiler, npm latest) breaks the lint toolchain. create-vite 9.1.2 template pins `~6.0.2`; use `~6.0.3` (latest 6.x) with `strict: true` [VERIFIED: npm registry] |
| @tanstack/react-router | 1.170.22 | SPA router | Type-safe routes, React 19 peer (`>=18 || >=19`) [VERIFIED: npm registry]. Official SPA scaffold: `@tanstack/cli create --router-only` [CITED: tanstack.com/router quick-start] |
| Tailwind CSS | 4.3.3 | Styling | CSS-first v4; ships native `print:` variant → `@media print` [VERIFIED: tailwindcss source variants.ts:1212]; `@tailwindcss/vite` plugin install path documented [CITED: tailwindcss.com/docs/installation/using-vite] |
| shadcn/ui | 4.16.2 (CLI) | Component system | Open-code components in repo; standard for Tailwind v4 + Vite [VERIFIED: npm registry — shadcn@4.16.2] |
| Dexie | 4.4.4 | IndexedDB wrapper | Schema versioning + migrations + live queries [VERIFIED: npm registry] |
| vite-plugin-pwa | 1.3.0 | PWA / offline | Vite 8 peer (`vite: ^3.1.0...^8.0.0`). `registerType: 'prompt'` is the **default**; `autoUpdate` is opt-in [CITED: vite-pwa.org/guide + prompt-for-update] |
| @playwright/test | 1.62.1 | Parity harness / e2e | Headless Chromium screenshots + `page.pdf()`; engines `node >=20` [VERIFIED: npm registry] |
| pixelmatch | 7.2.0 | Image diffing | Perceptual OKLab diff, `threshold`, `includeAA`, `windowSize` density option; needs pngjs ^7 [VERIFIED: npm registry + pixelmatch README] |
| pngjs | 7.0.0 | PNG decode/encode | Required by pixelmatch harness [VERIFIED: npm registry + pixelmatch README] |
| pdfjs-dist | 6.2.108 | PDF → PNG rasterization | Renders `page.pdf()` output to per-page images for comparison; engines `node >=22.13 || >=24` — Node 24 OK [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | 6.0.5 | React integration | **Template default** (create-vite 9.1.2 ships it). Use the template default rather than plugin-react-swc to avoid template drift [VERIFIED: create-vite template package.json] |
| oxlint | 1.77.0 | Linting | **Template default** (create-vite 9.1.2 ships `"lint": "oxlint"` instead of ESLint). Keep it for the spike baseline [VERIFIED: create-vite template package.json + npm] |
| dexie-react-hooks | 4.4.0 | Reactive DB reads | `useLiveQuery` for future dashboard; Dexie 4 peer range `<5` [VERIFIED: npm registry] |
| clsx + tailwind-merge | latest | Class composition | Installed automatically by shadcn/ui (`cn()` helper) [CITED: STACK.md:39] |
| lucide-react | latest | Icons (shadcn default) | Only if needed; HugeIcons deferred — Phase 1 needs no icons |
| @types/react / @types/react-dom | 19.2.x | React types | Template includes [VERIFIED: create-vite template package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite 8 SPA + TanStack Router | TanStack Start 1.168.39 (PRD pin) | Start is RC, requires Node server runtime, SSR/server functions/streaming — all out of scope; Start's own docs recommend Router alone for SPAs [CITED: tanstack.com/start overview]. Revisit only if the product gains server features later |
| print-CSS primary | @react-pdf/renderer 4.5.1 primary | Second layout engine (Yoga+pdfkit) must be kept in sync forever; parity not by construction; known force-fit pagination bug class. Adopt only if spike Safari tests fail [CITED: react-pdf.org/advanced + PITFALLS.md:22] |
| Playwright `page.pdf()` + pdfjs-dist rasterization | pdftoppm (poppler CLI) | pdfjs-dist is npm-native (no system package, no CI apt install); pdftoppm needs a system binary. pdfjs-dist engines match our Node 24 [VERIFIED: npm registry] |
| pixelmatch | Playwright built-in `toHaveScreenshot` | Playwright's snapshot matcher compares against committed baselines but its maxDiffPixelRatio is coarse and doesn't produce windowed-density diffs; pixelmatch gives explicit threshold/includeAA/windowSize control and diff images for the parity contract [VERIFIED: pixelmatch README] |
| TypeScript 7.0.2 (npm latest) | TypeScript 6.0.3 | TS 7 native compiler breaks typescript-eslint (`<6.1.0` peer). TS 6.0.x keeps the full lint+typecheck toolchain [VERIFIED: npm registry] |

**Installation:**
```bash
# Scaffold (stock template — do NOT hand-edit yet)
pnpm create vite@latest . --template react-ts
pnpm install

# Core
pnpm add @tanstack/react-router dexie @tanstack/react-form zod
pnpm add -D tailwindcss @tailwindcss/vite vite-plugin-pwa @playwright/test pixelmatch pngjs pdfjs-dist

# UI
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label card

# PDF fallback (ONLY if spike rejects print-CSS — keep optional)
pnpm add @react-pdf/renderer
```

**Version verification:** all versions above verified 2026-08-07 via `npm view <pkg> version` (see Sources).

## Package Legitimacy Audit

> All packages checked via `gsd-tools query package-legitimacy check` (2026-08-07). Verdicts `SUS` are purely the **recency heuristic** ("too-new") firing on packages published within days — every one is the actual current stable version, has a real source repo, real download volume, no `postinstall` script, and no deprecation flag (verified via `npm view`). None are slopsquats; no package was removed.

| Package | Registry | Age | Downloads (wk) | Source Repo | Verdict | Disposition |
|---------|----------|-----|---------------|-------------|---------|-------------|
| vite@8.2.1 | npm | 1 day (v8.2.x line ~8 mo) | 162M | github.com/vitejs/vite | SUS (recency only) | Approved — real stable release |
| react@19.2.8 / react-dom@19.2.8 | npm | 2 wk | 161M / 152M | github.com/react/react | SUS (recency only) | Approved |
| typescript@~6.0.3 | npm | 1 mo (6.0.x) | 259M | github.com/microsoft/TypeScript | SUS (recency only) | Approved |
| @tanstack/react-router@1.170.22 | npm | 1 day (line active) | 21.7M | github.com/TanStack/router | SUS (recency only) | Approved |
| tailwindcss@4.3.3 / @tailwindcss/vite@4.3.3 | npm | 3 wk | 119M / 42.8M | github.com/tailwindlabs/tailwindcss | SUS (recency only) | Approved |
| dexie@4.4.4 | npm | 7 wk | 2.1M | github.com/dexie/Dexie.js | OK | Approved |
| dexie-react-hooks@4.4.0 | npm | ~5 mo | 439K | github.com/dexie/Dexie.js | OK | Approved |
| vite-plugin-pwa@1.3.0 | npm | 3 mo | 4.2M | github.com/vite-pwa/vite-plugin-pwa | OK | Approved |
| @react-pdf/renderer@4.5.1 | npm | 4 mo | 4.9M | github.com/diegomura/react-pdf | OK | Approved (fallback only) |
| pixelmatch@7.2.0 | npm | 3 mo | 9.1M | github.com/mapbox/pixelmatch | OK | Approved |
| @playwright/test@1.62.1 / playwright@1.62.1 | npm | 8 days | 52M / 78M | github.com/microsoft/playwright | SUS (recency only) | Approved |
| zustand@5.0.14 | npm | 2.5 mo | 49.7M | github.com/pmndrs/zustand | OK | Approved |
| zod@4.4.3 | npm | 3 mo | 251.7M | github.com/colinhacks/zod | OK | Approved |
| pdfjs-dist@6.2.108 | npm | current | — | github.com/mozilla/pdf.js | — (not in gate list) | Approved — mozilla.org project |
| pngjs@7.0.0 | npm | current | — | github.com/lukeapage/pngjs | — | Approved |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none — all `SUS` flags are the recency heuristic on legitimate current releases; no `checkpoint:human-verify` tasks required. (Verified: no postinstall scripts on any listed package.)

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│  BUILD TIER (CI + dev, Node 24)                                    │
│  create-vite react-ts → vite build → static dist/                  │
│  tsc -b (typecheck) · oxlint (lint) · playwright test (parity)     │
└──────────────┬─────────────────────────────────────────────────────┘
               │ static files (no server)
               ▼
┌────────────────────────────────────────────────────────────────────┐
│  BROWSER TIER (runtime)                                            │
│                                                                    │
│  ┌──────────────────────┐      ┌───────────────────────────────┐  │
│  │ DOCUMENT MODEL        │      │ TWO PROJECTIONS (same DOM)   │  │
│  │ (pure serializable    │─────▶│  1. Screen: A4 canvas in     │  │
│  │  fixture object —     │      │     builder (WYSIWYG,        │  │
│  │  seed of Phase 2)     │      │     screen media)            │  │
│  └──────────────────────┘      │  2. Print: SAME DOM via       │  │
│        │                       │     @media print + @page      │  │
│        ▼                       │     (parity by construction)  │  │
│  Dexie (IndexedDB) ───────────▶│                               │  │
│  (Phase 2 — stub in spike)     └───────────────────────────────┘  │
│                                                                    │
│  Router: TanStack Router (SPA)   Shell: vite-plugin-pwa (prompt)  │
│  UI: Tailwind v4 + shadcn/ui     State: (Phase 2 — Zustand)       │
└────────────────────────────────────────────────────────────────────┘
        │                     ▲
        │ user prints         │ user downloads (Phase 6)
        ▼                     │
┌────────────────────────────────────────────────────────────────────┐
│  PARITY HARNESS (Playwright, headless Chromium, runs in CI)        │
│  Same fixture → 3 captures → pixelmatch diffs                      │
│  1. preview: page.screenshot() (screen media)                      │
│  2. print-projection: emulateMedia(print) + screenshot             │
│  3. pdf: page.pdf({format:'A4',printBackground:true})              │
│     → pdfjs-dist rasterize per page                                │
│  Assert: preview == pdf (per page, windowed density < threshold)   │
└────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/                # Router setup (routeTree.gen.ts), providers, PWA register
├── routes/             # TanStack Router file-based routes (index.tsx = spike canvas)
├── document/           # Pure fixture document model + fixture data (seed of Phase 2)
│   ├── types.ts        # DocumentModel types (renderer-agnostic, serializable)
│   ├── fixtures.ts     # realistic invoice fixture: long names, 12+ items, accents, logo
│   └── watermark.ts    # watermark renderer (Draft/Paid) — shared by both projections
├── components/
│   └── DocumentPage.tsx # THE single component rendered on screen AND printed (parity core)
├── styles/
│   └── print.css       # @page A4, @media print rules, print-color-adjust: exact
├── lib/
│   └── utils.ts        # cn() from shadcn
tests/                  # Playwright parity harness (gitignored artifacts + committed baselines)
├── fixtures/           # committed golden baselines (test artifacts)
├── parity.spec.ts      # the harness
└── playwright.config.ts
.github/
└── workflows/
    └── ci.yml          # lint + typecheck + build + parity test
```

### Pattern 1: Two Projections, One DOM (parity by construction)
**What:** The WYSIWYG canvas is HTML. The print output is the *same* HTML rendered under `@media print` + `@page`. There is exactly one document component (`DocumentPage.tsx`); screen and print differ only by CSS media. Parity is guaranteed by construction — there is no second layout engine to drift.
**When to use:** Always, unless the spike's Safari paged-media tests fail (then react-pdf becomes the second projection of the *same pure model* — never a parallel implementation).
**Example (print CSS):**
```css
/* src/styles/print.css — the entire PDF path */
@page {
  size: A4;
  margin: 15mm;
}
@media print {
  body * { visibility: hidden; }      /* hide app chrome */
  .app-shell { display: none !important; }
  #print-root, #print-root * {
    visibility: visible;
  }
  #print-root {
    position: absolute; left: 0; top: 0;
    width: 100%;                       /* full A4 content box */
    -webkit-print-color-adjust: exact; /* logos, watermark, colors */
    print-color-adjust: exact;
  }
  .page-break { break-inside: avoid; } /* line-item rows never split */
}
```
Source: pattern synthesized from [CITED: MDN Printing guide — @media print + @page] and [CITED: playwright.dev class-page — -webkit-print-color-adjust: exact for PDF color fidelity].

### Pattern 2: Golden-image parity harness
**What:** One fixture document, three captures, pairwise pixelmatch. Runs in dev (`pnpm test`) and CI. Baselines committed; diffs uploaded as artifacts on failure.
**When to use:** Every render-affecting phase from Phase 3 onward (PITFALLS.md:36 mandates it).
**Example flow:**
```typescript
// tests/parity.spec.ts — skeleton (full harness in Code Examples)
test('preview matches PDF', async ({ page }) => {
  await page.goto('/?fixture=invoice-torture');       // app renders fixture from URL param
  const preview = await page.screenshot({ fullPage: true }); // 1. screen projection

  await page.emulateMedia({ media: 'print' });        // 2. print projection
  const printShot = await page.screenshot({ fullPage: true });

  const pdf = await page.pdf({ format: 'A4', printBackground: true }); // 3. real PDF
  const pdfPages = await rasterizePdf(pdf);           // pdfjs-dist → PNG per page

  // compare per-page: printShot slice vs pdfPages[n], preview vs printShot
});
```

### Anti-Patterns to Avoid
- **Two layout engines in parallel:** HTML preview + react-pdf output side-by-side is the documented #1 product killer (PITFALLS.md:16-36). If react-pdf is adopted, the preview must render the actual react-pdf output — never a separate HTML lookalike.
- **Scaffolding by hand:** `create-vite` 9.1.2 already wires TS 6.0.x, oxlint, `tsc -b`, `@vitejs/plugin-react` correctly. Hand-editing the template to "modern" versions (e.g., TS 7.0.2, ESLint) breaks the peer matrix — TS 7 is unsupported by typescript-eslint [VERIFIED: npm registry].
- **Testing the PWA in dev:** service workers only exist in production builds; test SW behavior in `vite preview`/CI build output, never dev (PITFALLS.md:331).
- **`registerType: 'autoUpdate'`:** for a form app it reloads tabs mid-edit and loses data; `prompt` is the default and the docs' recommendation for form apps (PITFALLS.md:320).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image diffing | Custom pixel comparison | pixelmatch 7.2.0 | Perceptual OKLab + HyAB metrics, AA-pixel detection, windowed density; a few hundred lines, no deps [VERIFIED: pixelmatch README] |
| PNG decode/encode | Custom PNG parser | pngjs 7.0.0 | Required by pixelmatch; battle-tested [VERIFIED: npm registry] |
| PDF rasterization | Parsing PDF bytes by hand | pdfjs-dist 6.2.108 | Mozilla's official renderer; converts PDF pages to canvases/PNGs for the harness [VERIFIED: npm registry] |
| Print-to-PDF in tests | Custom PDF generator | Playwright `page.pdf()` | Headless Chromium's real print pipeline — same engine as user-facing "Save as PDF" [CITED: playwright.dev class-page] |
| PWA / service worker | Hand-written SW + manifest | vite-plugin-pwa 1.3.0 | Workbox precache, manifest, icons, registerType handling [CITED: vite-pwa docs] |
| SPA router | Window-history glue | TanStack Router 1.170.22 | Type-safe routes, file-based codegen, devtools [CITED: tanstack.com/router quick-start] |
| Offline IndexedDB layer | Raw IndexedDB | Dexie 4.4.4 | Schema versioning + migrations + live queries; raw IDB is a footgun [CITED: PITFALLS.md:107] |

**Key insight:** Every hand-rolled item here is a *correctness* risk, not a convenience risk — pixel comparisons, PNG codecs, PDF parsing, and print engines are exactly the kind of low-level code where edge cases (AA pixels, glyph metrics, page breaks) dominate and are already solved. The spike's job is to *prove* the stack, not to *write* the stack.

## Common Pitfalls

### Pitfall 1: Scaffold drift — "upgrading" the template breaks the toolchain
**What goes wrong:** Installing TS 7.0.2 or swapping oxlint for ESLint breaks typecheck/lint; `tsc -b` fails under TS 7; the build gate goes red for reasons unrelated to the spike.
**Why it happens:** npm `latest` is TS 7.0.2 (native compiler); typescript-eslint 8.66.0 peers on `<6.1.0` [VERIFIED: npm registry]. create-vite 9.1.2 ships TS `~6.0.2` + oxlint for exactly this reason [VERIFIED: template package.json].
**How to avoid:** Use the template versions verbatim. Only change `tsconfig` to add `"strict": true` (already strict in template) and adjust `~6.0.2` → `~6.0.3`.
**Warning signs:** `pnpm typecheck` or `pnpm lint` failing immediately after scaffold with peer errors.

### Pitfall 2: Asserting Safari paged-media from docs instead of from the spike
**What goes wrong:** The ADR claims "Safari handles repeating headers + mm margins fine" without a test, and Phase 3 ships a broken Safari print path.
**Why it happens:** Safari's `@page` support is recent (18.2+, per caniuse — not supported 3.1–18.1) and repeating-thead behavior across pages is browser-implementation-dependent, not spec-guaranteed [CITED: caniuse.com/css-paged-media].
**How to avoid:** The spike must include a **real Safari print test** (WebKit print-to-PDF or manual macOS Safari 18.2+ print) for: repeating table headers, mm margins, and per-page watermark. This is the ROADMAP's explicit criterion (a). CI runs Chromium parity; Safari fidelity is a documented manual/WebKit verification step in the ADR.
**Warning signs:** ADR cites docs for Safari behavior instead of a test artifact.

### Pitfall 3: Comparing preview to PDF at different scales/resolutions
**What goes wrong:** The preview screenshot (device-pixel-ratio dependent) is diffed against rasterized PDF pages (PDF-point dependent) → false mismatches everywhere.
**Why it happens:** `page.screenshot` uses CSS pixels × DPR; `page.pdf` + pdfjs-dist renders at PDF points × scale.
**How to avoid:** Pin both captures to identical pixel dimensions — e.g., render PDF pages at `scale = deviceScaleFactor` and normalize all images to the same width before diffing; or capture the preview with `deviceScaleFactor: 1` and rasterize PDF at `scale: 1` in a fixed A4@96dpi coordinate space. Put this normalization in one helper and unit-test it (it's the flakiest part of the harness).
**Warning signs:** First harness run reports 100% diff on identical documents.

### Pitfall 4: Watermark positioning differs between projections
**What goes wrong:** The on-screen watermark sits at a different offset/opacity than the printed one, failing BRND-06 parity.
**Why it happens:** A watermark implemented as a screen-only overlay (`position: fixed` to viewport) moves/duplicates under print pagination.
**How to avoid:** Implement the watermark inside `DocumentPage.tsx` as a per-page positioned element (absolute within each A4 page block), rendered by both projections identically, and include it in the fixture. Verify per-page repetition in the actual `page.pdf()` output (PDF-06 in the harness asserts it).
**Warning signs:** Watermark appears once on a multi-page PDF, or shifts between preview and print.

### Pitfall 5: Committing generated golden images as the baseline without a human review step
**What goes wrong:** The first generated "golden" is wrong (missing logo, wrong font) and every later render is compared against a wrong baseline — parity tests pass while the output is bad.
**Why it happens:** CI auto-writes baselines on first run.
**How to avoid:** Baselines are **committed deliberately** after a human/Safari sanity check; CI never writes baselines (only updates via explicit `pnpm test:update` + code review). The fixture invoice must render correctly in real Safari 18.2+ first.
**Warning signs:** A parity test "passes" with a 100%-white baseline.

## Code Examples

### Playwright parity harness (core skeleton)
```typescript
// tests/parity.spec.ts
import { test, expect, Page } from '@playwright/test';
import * as pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { getDocument } from 'pdfjs-dist'; // pdfjs-dist 6.x API

// Normalize any PNG buffer to a common width before diffing (Pitfall 3 fix)
function normalize(img: PNG, targetWidth: number): PNG { /* ... */ }

async function rasterizePdf(pdfBuffer: Buffer, scale = 1): Promise<PNG[]> {
  const doc = await getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const pages: PNG[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = /* new canvas at viewport.width/height, renderContext */;
    await page.render(renderContext).promise;
    pages.push(PNG.sync.read(canvas.toBuffer('image/png')));
  }
  return pages;
}

async function diffPixels(a: Buffer, b: Buffer, width: number, height: number): Promise<number> {
  const imgA = PNG.sync.read(a);
  const imgB = PNG.sync.read(b);
  const diff = new PNG({ width: imgA.width, height: imgA.height });
  return pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, {
    threshold: 0.1,   // 0.1 default; tune per fixture
    includeAA: false, // ignore anti-aliasing
  });
}

test('fixture: preview, print projection, and PDF are pixel-identical', async ({ page }) => {
  await page.goto('/?fixture=invoice-torture');
  await page.waitForSelector('#print-root');           // app renders fixture

  const preview = await page.screenshot({ fullPage: true });        // 1. screen
  await page.emulateMedia({ media: 'print' });                       // 2. print media
  const printShot = await page.screenshot({ fullPage: true });
  await page.emulateMedia({ media: 'screen' });

  const pdf = await page.pdf({ format: 'A4', printBackground: true }); // 3. real PDF
  const pdfPages = await rasterizePdf(pdf);

  // per-page assertion: preview slice == pdf page (density threshold)
  const maxDiff = /* windowed density over diffPixels */;
  expect(maxDiff).toBeLessThan(0.001); // fraction of pixels; calibrate in spike
});
```
Source: API verified against [CITED: playwright.dev class-page (screenshot, pdf, emulateMedia)] and [CITED: pixelmatch README (pixelmatch signature, options)].

### vite-plugin-pwa — prompt strategy (the recommended default)
```typescript
// vite.config.ts (excerpt)
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt', // default — explicit for clarity; NEVER autoUpdate for a form app
      includeAssets: ['favicon.svg'],
      manifest: { name: 'Paperchaser', display: 'standalone', theme_color: '#ffffff' },
      workbox: { cleanupOutdatedCaches: true }, // default true in generateSW — keep it
    }),
  ],
});

// src/app/pwa.ts
import { registerSW } from 'virtual:pwa-register';
export const updateSW = registerSW({
  onNeedRefresh() { /* show "Update available" banner → updateSW(true) reloads */ },
  onOfflineReady() { /* ready banner */ },
});
```
Source: [CITED: vite-pwa-org.netlify.app/guide/prompt-for-update].

### Print CSS for the fixture document
```css
/* src/styles/print.css */
@page { size: A4; margin: 15mm; }         /* mm margins — Safari 18.2+ [CITED: caniuse] */

@media print {
  .app-shell { display: none !important; }
  #print-root { width: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead { display: table-header-group; }  /* repeat table header on every page */
  tr { break-inside: avoid; }             /* line-item rows never split */
  .watermark { position: absolute; top: 40%; left: 0; right: 0;
               text-align: center; transform: rotate(-30deg); opacity: 0.15; }
}
```
Note: `print-color-adjust: exact` is Baseline 2025 — safe [CITED: MDN]. The exact per-page watermark + repeating-header behavior must be verified in the spike on Safari 18.2+ (Pitfall 2).

### GitHub Actions CI baseline
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build-and-parity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck          # tsc -b (template script)
      - run: pnpm build              # tsc -b && vite build (template script)
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test               # parity harness
      - if: failure()
        uses: actions/upload-artifact@v4
        with: { name: parity-diffs, path: tests/artifacts/, retention-days: 7 }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TanStack Start (SSR full-stack, RC) | Vite 8 SPA + TanStack Router | Start still RC (2026); Router-alone guidance | No server runtime, static deploy, simpler toolchain for a no-backend product [CITED: tanstack.com/start overview] |
| TypeScript 5.x toolchain | TS 6.0.x (with TS 7 native compiler on npm latest) | 2026 | TS 7 breaks typescript-eslint (`<6.1.0` peer) — pin 6.0.x [VERIFIED: npm registry] |
| ESLint in Vite templates | oxlint in create-vite 9.1.2 | create-vite 9.x | Template lint script is `oxlint` — keep template default [VERIFIED: template package.json] |
| `@page` unsupported in Safari | Safari 18.2+ supports `@page` | Safari 18.2 (caniuse 2026) | Print-CSS path now viable on current Safari — but must be verified empirically (Pitfall 2) [CITED: caniuse.com/css-paged-media] |
| `print-color-adjust` inconsistent | Baseline 2025 (all browsers) | May 2025 | `exact` is safe everywhere for logos/watermark colors [CITED: MDN] |
| Playwright image snapshot matcher only | pixelmatch with windowed density | ongoing | Density-based diffing stays stable across GPU dithering/noise [VERIFIED: pixelmatch README] |

**Deprecated/outdated:**
- **Tailwind v3** (config-file model): legacy; v4 CSS-first with `@tailwindcss/vite` (STACK.md:103). The v4 `print:` variant is natively `@media print` [VERIFIED: tailwindcss source].
- **html2canvas + jsPDF rasterization:** stalled, bitmap output, non-selectable text — rejected (STACK.md:114-117).
- **react-to-print as a separate option:** it's just `window.print()` ergonomics — not a distinct PDF path (STACK.md:93).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Playwright `page.pdf()` is Chromium-only (WebKit/Firefox throw) | Standard Stack / Harness | If WebKit gained `page.pdf()` support, Safari parity could be automated in CI directly; the harness would still work as specified (Chromium), so risk is LOW — it's about CI *scope*, not correctness |
| A2 | `page.pdf()` output ≈ user's real "Save as PDF" (both use Chromium's print pipeline) | Harness | If Chromium's headless print pipeline diverges from Chrome's headed print, CI parity passes while real-user PDFs differ; mitigated by the Phase 3 real-browser verification step |
| A3 | pdfjs-dist rasterization with `scale: 1` at A4@96dpi produces images directly comparable to a DPR-1 screenshot | Harness | Wrong scale assumption → false diff; mitigated by the normalize() helper + calibration in the spike (Pitfall 3) |
| A4 | `window.print()` in a user's browser respects `@page { size: A4; margin: 15mm }` for margins | Print CSS | If margins are overridden by print dialog settings, PDF-05 needs the margins enforced differently; verified in Phase 3 real-browser testing |
| A5 | Safari 18.2+ `@page` support implies Safari repeating-table-header support | PDF ADR | Repeating `thead` across pages is implementation-specific; the spike's Safari test decides criterion (a) — this is exactly what the ADR must record (Pitfall 2) |
| A6 | Node 24 + `create-vite` 9.1.2 + `pnpm dlx shadcn@latest init` will complete without interactive surprises on this machine | Scaffold | If the shadcn CLI prompts interactively, CI/scripted scaffold needs `--yes`/`--defaults`; verify in the spike's scaffold step |
| A7 | The fixture document can be injected via `?fixture=name` query param read in a dev route | Harness | If URL-param injection fights TanStack Router search-param typing, use `window.__INJECT_FIXTURE__` via `page.addInitScript` instead — trivial fallback |
| A8 | pdfjs-dist 6.2.108 runs under Node 24 in the Playwright test process | Harness | pdfjs-dist engines allow Node >=22.13/>=24, but worker setup in Node needs `canvas` package for full rendering — if `canvas` native build fails in CI, fall back to rendering in-page (browser-context pdfjs) or `pdftoppm` |

## Open Questions (RESOLVED)

1. **Framework: Vite SPA vs TanStack Start → Vite SPA + TanStack Router (RESOLVED).** Start is RC ("feature-complete... not bug-free"), needs Node ≥22.12 server runtime, and its own docs recommend Router alone when SSR/server features are unneeded [CITED: tanstack.com/start/latest/docs]. Router 1.170.22 verified on npm with React 19 peer [VERIFIED: npm registry]. The `@tanstack/cli create --router-only` scaffold exists [CITED: tanstack.com/router quick-start]. Static deploy, no SSR traps, full TanStack family retained. This resolves SUMMARY.md's "Start complexity" pitfall (PITFALLS.md:346-371).

2. **PDF path: print-CSS vs react-pdf → print-CSS primary (RESOLVED with spike confirmation gates).** Decisive: Playwright `page.pdf()` renders the *print CSS media* headlessly — the same projection as the screen preview → parity is testable in CI and guaranteed by construction [CITED: playwright.dev]. Safari `@page` now supported 18.2+ (was the historical blocker) [CITED: caniuse]. `print-color-adjust: exact` Baseline 2025 [CITED: MDN]. react-pdf is a second layout engine (Yoga+pdfkit, Knuth–Plass) — PITFALLS.md:22 documents the perpetual-sync cost and the open force-fit pagination bug class. **Spike gates that could still flip the ADR to react-pdf:** (a) Safari 18.2+ repeating-table-header failure, (b) per-page watermark positioning failure in Safari print, (c) mm-margin drift. These are the exact criteria in ROADMAP SC#2 and are now framed as falsifiable tests, not vibes.

3. **Parity harness tooling: Playwright vs pixelmatch → BOTH (RESOLVED).** Playwright captures (screenshot + emulateMedia + page.pdf), pixelmatch diffs. This was SUMMARY.md's flagged Phase 3 mini-spike; the toolchain is now decided — only threshold calibration (empirical, per-fixture) remains for Phase 3.

4. **TypeScript version → 6.0.3 (RESOLVED).** npm `latest` is 7.0.2 but typescript-eslint peers `<6.1.0`; create-vite ships `~6.0.2`. This corrects STACK.md's "pin to latest 5.x if tooling lags" — the actual resolution is 6.0.x, and the stock template already handles it.

5. **Scaffold minimalism → stock template + one route + one fixture (RESOLVED).** The spike does NOT build the three-pane builder, Zustand, forms, or dnd-kit (Phase 4 concerns). It needs: one TanStack Router route rendering `DocumentPage.tsx` from a hardcoded fixture (seeded via query param for the harness), the print stylesheet, Dexie schema stub (Phase 2 owns real schemas), PWA shell, and the parity test. Anything more is scope creep that delays the two ADRs.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8 (engines ^20.19 \|\| >=22.12) | ✓ | v24.12.0 | — |
| npm | package installs | ✓ | 11.16.0 | pnpm (preferred per shadcn/TanStack docs; `corepack enable pnpm`) |
| git | repo | ✓ | repo initialized | — |
| GitHub Actions | CI baseline | ✓ (repo on GitHub implied) | — | Local `pnpm lint && typecheck && build && test` until push |
| Playwright browsers | parity harness | ✗ (not yet installed) | — | `pnpm exec playwright install --with-deps chromium` in scaffold step; WebKit optional for Safari-fidelity spot checks |
| Safari 18.2+ (macOS) | PDF ADR criterion (a)/(b) — Safari paged-media | ✗ (not verifiable in this environment) | — | Manual verification step recorded in ADR as acceptance evidence; CI runs Chromium parity only |
| pdfjs-dist native `canvas` dep | PDF rasterization under Node | ✗ (native build may fail headless) | — | Render PDF in browser context, or `pdftoppm` (poppler) via apt in CI — decision point in spike (A8) |

**Missing dependencies with no fallback:**
- **Safari 18.2+ real browser** for the paged-media fidelity criterion. No macOS browser available in this Linux environment. This is a *documented manual acceptance step* in the ADR, not a blocker for the harness (Chromium parity runs in CI).

**Missing dependencies with fallback:**
- Playwright browsers → install in scaffold step (one command).
- pdfjs-dist Node rasterization → in-browser rendering or pdftoppm fallback (A8).

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — this section is required. **For Phase 1 the golden-image parity harness IS the validation architecture**; it is the phase's primary deliverable and feeds VERIFICATION.md generation.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | @playwright/test 1.62.1 (Chromium) + pixelmatch 7.2.0 + pngjs 7.0.0 + pdfjs-dist 6.2.108 |
| Config file | `playwright.config.ts` (root) |
| Quick run command | `pnpm exec playwright test tests/parity.spec.ts` |
| Full suite command | `pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test` |
| Golden baselines | committed under `tests/fixtures/` — never auto-written by CI (Pitfall 5) |
| Update command | `pnpm exec playwright test --update-snapshots` (explicit, reviewed) |

### Success Criteria → Test Map
| SC # | Behavior | Test Type | Automated Command | File Exists? |
|------|----------|-----------|-------------------|-------------|
| SC1 | ADR records framework decision with evidence | manual (document review) | — (document artifact: `docs/adr/0001-framework.md`) | ❌ Wave 0 |
| SC2 | ADR records PDF path decision vs explicit criteria | manual (document review) + Safari acceptance test | — (artifact `docs/adr/0002-pdf-path.md`; Safari print test manual) | ❌ Wave 0 |
| SC3 | Parity harness proves preview == print == PDF on fixtures (long names, 12+ items, accents, logo, watermark) | integration (golden-image) | `pnpm exec playwright test tests/parity.spec.ts` | ❌ Wave 0 |
| SC4 | Scaffold boots, static build, green CI (lint + typecheck + build) | smoke | `pnpm lint && pnpm typecheck && pnpm build` | ❌ Wave 0 |
| SC4 | Harness runs in CI | CI | `.github/workflows/ci.yml` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm exec playwright test tests/parity.spec.ts -g fixture` (fixture subset) + `pnpm typecheck`
- **Per wave merge:** full suite above
- **Phase gate:** full suite green before `/gsd-verify-work`; both ADRs written and the Safari acceptance evidence attached

### Wave 0 Gaps
- [ ] `tests/parity.spec.ts` — the parity harness (SC3) — does not exist; it is the phase's core deliverable
- [ ] `playwright.config.ts` — harness config (webServer: `vite preview`, project: chromium, artifacts dir)
- [ ] `tests/helpers/raster.ts` — pdfjs-dist → PNG normalization helper (Pitfall 3)
- [ ] `.github/workflows/ci.yml` — CI baseline (SC4)
- [ ] `docs/adr/0001-framework.md` + `docs/adr/0002-pdf-path.md` — ADR artifacts (SC1/SC2)
- [ ] `tests/fixtures/*.png` — committed golden baselines, generated after a human/Safari sanity check (Pitfall 5)
- [ ] Framework install: `pnpm add -D @playwright/test pixelmatch pngjs pdfjs-dist && pnpm exec playwright install chromium`

## Security Domain

> `workflow.security_enforcement: true` (ASVS level 1, block on high) — this section is required. The spike ships no user input, no network calls, no auth, no stored secrets; the threat surface is the scaffold + harness toolchain. Phase-appropriate scope only.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth exists (no accounts — REQUIREMENTS.md) |
| V3 Session Management | No | Stateless SPA; no sessions |
| V4 Access Control | No | Single-user local app; no authorization model |
| V5 Input Validation | Yes (minimal) | The fixture is hardcoded; the `?fixture=` query param is dev-only and must be validated against a whitelist (`invoice-torture` | `invoice-simple`) before it feeds the renderer — never `JSON.parse` arbitrary query input (Phase 2 owns real import validation with Zod) |
| V6 Cryptography | No | No secrets, no keys, no PII transmission; PDFs and JSON backups stay local |

### Known Threat Patterns for the Spike Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Query-param injection into the renderer (`?fixture=`) | Tampering | Whitelist the fixture key at the route boundary; never reflect raw query strings into the DOM [ASSUMED: standard input-validation practice] |
| Harness artifacts leaking fixture PII into git (test invoices contain names/addresses) | Information Disclosure | Use synthetic fixture data (clearly fictional names like "Müller GmbH", "José Álvarez") — never real customer data; add `tests/artifacts/` to `.gitignore` |
| Malicious devDependency in scaffold | Tampering | Lockfile (`pnpm-lock.yaml`) committed from first install; all packages in the legitimacy audit above are clean (no postinstall, real repos, high volume) |
| XSS via future user content | Tampering | Phase 2+ concern (Zod-validate imports, escape on render — PITFALLS.md:427-429); out of scope for the fixture-driven spike, but the fixture renderer must NOT use `dangerouslySetInnerHTML` even with fixture data — establish the habit now |

## Sources

### Primary (HIGH confidence)
- **npm registry** (`npm view <pkg> version` + `peerDependencies` + `engines`), fetched 2026-08-07 — exact versions for the full stack: vite 8.2.1, react/react-dom 19.2.8, typescript 6.0.3/7.0.2 (dist-tags), @tanstack/react-router 1.170.22, @tanstack/react-start 1.168.39, tailwindcss/@tailwindcss/vite 4.3.3, dexie 4.4.4, dexie-react-hooks 4.4.0, vite-plugin-pwa 1.3.0, @react-pdf/renderer 4.5.1, pixelmatch 7.2.0, pngjs 7.0.0, @playwright/test 1.62.1, pdfjs-dist 6.2.108, zustand 5.0.14, zod 4.4.3, create-vite 9.1.2, shadcn 4.16.2, oxlint 1.77.0, typescript-eslint 8.66.0 (peer `typescript >=4.8.4 <6.1.0`), vitest 4.1.10
- **create-vite react-ts template** (raw GitHub, main branch) — template package.json: `typescript ~6.0.2`, `oxlint`, `@vitejs/plugin-react ^6.0.5`, `build: tsc -b && vite build`
- **TanStack Start overview** (tanstack.com/start/latest/docs/framework/react/overview) — RC status verbatim, Router-alone guidance verbatim
- **TanStack Router quick-start** (tanstack.com/router/latest/docs/framework/react/quick-start) — `@tanstack/cli create --router-only`, React 18+/TS 5.3+ requirements
- **react-pdf v4 Advanced docs** (react-pdf.org/advanced) — wrapping engine, `wrap={false}`/`break`/`fixed` props, `render` prop called twice, orphan/widow, 30+ page worker guidance
- **Playwright API docs** (playwright.dev/docs/api/class-page) — `page.pdf()` (print CSS media, format A4, mm units, `-webkit-print-color-adjust: exact` note), `page.screenshot()`, `page.emulateMedia({media:'print'})`
- **pixelmatch README** (github.com/mapbox/pixelmatch) — API signature, threshold/includeAA/windowSize options, pngjs requirement
- **caniuse.com/css-paged-media** — Safari `@page`: not supported 3.1–18.1, supported 18.2+ (2026 data)
- **MDN print-color-adjust** — Baseline 2025, `economy`/`exact` values
- **MDN CSS Printing guide** — `@media print` + `@page` patterns
- **vite-plugin-pwa docs** (vite-pwa-org.netlify.app) — `registerType: 'prompt'` is default; prompt pattern via `virtual:pwa-register`; cleanupOutdatedCaches default true
- **Tailwind CSS v4 docs + source** (tailwindcss.com/docs/installation/using-vite; packages/tailwindcss/src/variants.ts:1212) — `@tailwindcss/vite` install; native `print:` static variant → `@media print`

### Secondary (MEDIUM confidence)
- **gsd-tools package-legitimacy check** (2026-08-07) — per-package verdicts; SUS flags are recency-heuristic only, cross-checked against npm metadata (repos, downloads, no postinstall)
- **Prior project research** — STACK.md, SUMMARY.md, PITFALLS.md, REQUIREMENTS.md, ROADMAP.md, STATE.md (verified 2026-08-07, read in full this session)

### Tertiary (LOW confidence)
- A1–A8 in the Assumptions Log — Playwright `page.pdf()` Chromium-only scope, print-pipeline equivalence, pdfjs rasterization scale, Safari repeating-header behavior — all converted into spike tests or harness normalization rather than asserted facts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version + peer/engine constraint verified against the npm registry and template source today; the one correction to prior research (TS 6.0.x, not 5.x/7.x) is registry-backed
- Architecture: HIGH — two-projections-one-DOM and the parity harness are primary-source documented patterns; the harness toolchain is fully specified
- Pitfalls: HIGH — derived from verified docs (typescript-eslint peer, caniuse, Playwright API) plus the prior research's verified pitfall catalogue (PITFALLS.md)
- PDF/Safari criteria: MEDIUM — Safari repeating-header and per-page-watermark behavior is implementation-specific and is deliberately left as a *falsifiable spike test* (A5), not asserted

**Research date:** 2026-08-07
**Valid until:** 2026-09-06 (30 days — fast-moving toolchain: Vite 8/TS 6/Playwright 1.62 all released within weeks; re-verify versions at Phase 3 if older than 30 days)
