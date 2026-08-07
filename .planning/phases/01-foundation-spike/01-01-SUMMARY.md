---
phase: 01-foundation-spike
plan: 01
subsystem: foundation
tags: [vite, react, typescript, tailwind, shadcn, tanstack-router, dexie, pwa, print-css, playwright]

# Dependency graph
requires: []
provides:
  - Vite 8 SPA scaffold with pinned toolchain (TS ~6.0.3, oxlint, tsc -b) and committed lockfile
  - Pure renderer-agnostic DocumentModel + torture/simple invoice fixtures (Phase 2 domain seed)
  - Single shared DocumentPage component rendering both screen and print projections (parity core)
  - A4 @15mm print stylesheet with repeating thead, break-inside avoid, exact color, draft watermark
  - Tailwind v4 + shadcn/ui (base-nova, neutral), Dexie version(1) stub, PWA shell (registerType prompt)
affects: [01-02 (parity harness consumes dist/ + fixture routes), 01-03 (CI consumes scripts), phase 02 domain core, phase 03 render pipeline, phase 06 PWA polish]

# Actuals (#2632) — pairs with plan estimate (66000 tokens @ low confidence).
actuals:
  tokens: 74613   # chars/4 over realized diff incl. pnpm-lock.yaml (298452 chars)
  tasks: 3        # tasks completed
  commits: 3      # commits made

# Tech tracking
tech-stack:
  added: [vite 8.2.1, react 19.2.8, typescript ~6.0.3, @tanstack/react-router 1.170.22, dexie 4.4.4, tailwindcss 4.3.3, @tailwindcss/vite 4.3.3, vite-plugin-pwa 1.3.0, @playwright/test 1.62.1, pixelmatch 7.2.0, pngjs 7.0.0, pdfjs-dist 6.2.108, shadcn 4.16.2 (base-nova), workbox-window 7.4.1, @base-ui/react, lucide-react, geist font, clsx, tailwind-merge, tw-animate-css]
  patterns:
    - "Two projections, one DOM (parity by construction): screen + print share DocumentPage; print.css applies @page/@media print to the same DOM"
    - "Integer minor units for all money math in the renderer (no floats)"
    - "Query-param whitelist at route boundary (never reflect raw query strings into the DOM)"
    - "Code-based TanStack Router routes (no file-based codegen plugin for the spike)"
    - "Dexie versioning discipline from first schema commit (empty version(1))"

key-files:
  created: [src/document/types.ts, src/document/fixtures.ts, src/components/DocumentPage.tsx, src/styles/print.css, src/styles/index.css, src/router.ts, src/routes/__root.tsx, src/routes/index.tsx, src/db/db.ts, src/app/pwa.ts, src/lib/utils.ts, components.json, src/components/ui/button.tsx, src/components/ui/input.tsx, src/components/ui/label.tsx, src/components/ui/card.tsx]
  modified: [package.json, pnpm-lock.yaml, vite.config.ts, tsconfig.app.json, tsconfig.json, index.html, src/main.tsx, .gitignore]

key-decisions:
  - "create-vite 9.1.2 react-ts template kept verbatim (oxlint, tsc -b, plugin-react 6.0.4→6.0.5) — no scaffold drift; TypeScript pinned ~6.0.3 (never 7.x, typescript-eslint peer <6.1.0)"
  - "Shadcn 4.16.2 base-nova preset (Base UI component library) with neutral base + CSS variables — the CLI's documented defaults per research A6"
  - "workbox-window 7.4.1 added as dev dep — required by vite-plugin-pwa 1.3.0 prompt-mode virtual module (its own declared range ^7.4.1)"
  - "baseUrl removed from tsconfigs — TS 6.0.3 errors TS5101 (deprecated in TS 6, removed in TS 7); paths resolve relative to tsconfig"
  - "VitePWA registerType 'prompt' (never autoUpdate) + storage.persist() request for eviction safety"

patterns-established:
  - "Fixture injection via ?fixture= query param, whitelisted at the route boundary against FIXTURE_MAP keys"
  - "Synthetic-only fixture data (fictional names/addresses) — never real PII (T-01-02)"
  - "All text rendered as React text nodes; raw-HTML injection attribute banned (grep-enforced, count 0)"

requirements-completed: ["spike (ROADMAP Phase 1 SC4: scaffold boots; SC3 foundation: single shared render component)"]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "Scaffold boots on green pipeline: Vite 8 SPA, TS ~6.0.3 strict, oxlint, tsc -b build emitting dist/, all pinned deps + committed pnpm-lock.yaml"
    verification:
      - kind: other
        ref: "pnpm lint && pnpm typecheck && pnpm build && ls dist/index.html (passed 2x, incl. post-commit tracer re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Torture fixture invoice (long company name, 18 line items, accented text, inline SVG data-URL logo, DRAFT watermark) renders through the single shared DocumentPage; print stylesheet wired into production bundle; ?fixture= whitelisted at route boundary"
    verification:
      - kind: other
        ref: "vite preview: /?fixture=invoice-torture|invoice-simple|bogus all HTTP 200 with id=root shell; grep 'InnerHTML' src/ == 0; print.css token grep all pass"
        status: pass
    human_judgment: true
    rationale: "Fixture CONTENT fidelity (logo placement, watermark, 18-item layout, A4 pagination) is client-rendered and asserted end-to-end by plan 01-02's golden-image parity harness (preview vs print vs PDF). This plan proved the shell, wiring, whitelist and build — not pixel-level rendering correctness."
  - id: D3
    description: "Tailwind v4 + shadcn/ui components (button/input/label/card + cn()), Dexie version(1) empty-stub db, PWA shell with registerType 'prompt' emitting dist/sw.js + dist/manifest.webmanifest + dist/favicon.svg"
    verification:
      - kind: other
        ref: "pnpm lint && pnpm typecheck && pnpm build && ls dist/sw.js dist/manifest.webmanifest dist/favicon.svg && grep registerType prompt (1) && grep autoUpdate (0)"
        status: pass
    human_judgment: false

# Metrics
duration: 40min
completed: 2026-08-07
status: complete
---

# Phase 1 Plan 1: Foundation Scaffold + Fixture Renderer Summary

**Vite 8 SPA scaffold with pinned toolchain (TS ~6.0.3, oxlint, tsc -b), a torture-fixture invoice rendered through one shared screen-and-print DocumentPage component, A4 @15mm print stylesheet wired into the production bundle, and Tailwind v4 + shadcn/ui + Dexie stub + PWA shell (registerType prompt) on a green lint/typecheck/build pipeline.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-08-07T15:41:15Z
- **Completed:** 2026-08-07T16:20:58Z
- **Tasks:** 3
- **Files modified:** 33 (including pnpm-lock.yaml and shadcn-generated files)

## Accomplishments

- Proven the full scaffold decision end-to-end: create-vite 9.1.2 react-ts template kept verbatim (oxlint + `tsc -b` build, plugin-react), TypeScript pinned `~6.0.3` (7.x breaks typescript-eslint), `strict: true`, all research-pinned deps installed at exact versions, `pnpm-lock.yaml` committed as the dependency-integrity baseline.
- Torture fixture (company "Gesellschaft für innovative Drucktechnologien und Dokumentenmanagement mbH", 18 line items with long wrapping descriptions, "José Álvarez García" + accented addresses, inline 96x96 data-URL SVG logo, DRAFT watermark) renders through exactly one shared component — `DocumentPage` with `id="print-root"` — that both screen and print projections consume (parity by construction).
- Print stylesheet (`@page A4 15mm`, visibility isolation, `print-color-adjust: exact`, `table-header-group` repeating thead, `break-inside: avoid`, rotated watermark) is imported globally in the production bundle. Per-page watermark repetition deliberately NOT claimed (single positioned element on first PDF page in Chromium; recorded in ADR 0002).
- `?fixture=` param whitelist-validated against `FIXTURE_MAP` keys at the route boundary (unknown keys fall back to `invoice-simple`); raw query strings never reflected into the DOM; raw-HTML injection attribute count == 0 in src/.
- Tailwind v4 + shadcn/ui (base-nova preset, neutral base, CSS variables), Dexie `version(1)` empty schema stub (versioning discipline from first commit), PWA shell with `registerType: 'prompt'` and `storage.persist()` request — production build emits `sw.js` + `manifest.webmanifest` + `favicon.svg`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite react-ts app with pinned deps** - `b95a81e` (feat)
2. **Task 2: Render torture fixture through shared DocumentPage + print css** - `e31d56d` (feat)
3. **Task 3: Wire Tailwind v4 + shadcn/ui, Dexie stub, PWA shell** - `ac6f0a5` (feat)

**Plan metadata:** `docs(01-01)` (final metadata commit)

_Note: Task 1 was the plan's tracer slice — post-commit re-run of its `<verify>` passed (⚡ Tracer verified end-to-end — expanding)._

## Files Created/Modified

- `src/document/types.ts` - Pure renderer-agnostic `DocumentModel`/`LineItem`/`Company`/`Customer` types; money in integer minor units (Phase 2 domain seed)
- `src/document/fixtures.ts` - `FIXTURE_MAP` with `invoice-torture` (18 items, long names, accents, data-URL SVG logo, draft watermark) + `invoice-simple` (5 items, no watermark); synthetic data only
- `src/components/DocumentPage.tsx` - THE single screen-and-print component: A4 page block, company header w/ logo, customer block, repeating-thead line-item table, integer-math totals (subtotal/tax/grand), watermark element
- `src/styles/print.css` - `@page A4 15mm`, visibility isolation, exact color adjust, repeating thead, row break-inside, rotated watermark
- `src/styles/index.css` - Tailwind v4 `@import "tailwindcss"` + shadcn theme variables
- `src/router.ts` + `src/routes/__root.tsx` + `src/routes/index.tsx` - Code-based TanStack Router; app-shell layout; index route whitelists `?fixture=`
- `src/db/db.ts` - Dexie `version(1).stores({})` empty stub
- `src/app/pwa.ts` - `registerSW` (prompt) with empty handlers + `storage.persist()`
- `src/lib/utils.ts`, `components.json`, `src/components/ui/{button,input,label,card}.tsx` - shadcn/ui base-nova components + `cn()` helper
- `vite.config.ts` - react + @tailwindcss/vite + VitePWA(prompt) + `@` alias
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` - pinned deps + integrity baseline
- `tsconfig.app.json` - `strict: true`, `@/*` paths, `vite-plugin-pwa/client` types
- `src/main.tsx` - RouterProvider + global print.css/index.css + `./app/pwa` side-effect import
- `index.html` - title Paperchaser

Deleted (per plan): `src/App.tsx`, `src/App.css` (template demo app), `src/index.css` (replaced by `src/styles/index.css`).

## Decisions Made

- **Template verbatim, no drift:** kept create-vite 9.1.2's oxlint/`tsc -b`/plugin-react toolchain; only pinned `typescript ~6.0.3` and added `typecheck` script (Pitfall 1).
- **shadcn 4.16.2 defaults:** base-nova preset on Base UI (the CLI's current recommended default), neutral base color, CSS variables on — per research A6, accept documented defaults rather than abort.
- **workbox-window 7.4.1:** required at build time by vite-plugin-pwa 1.3.0's `virtual:pwa-register` (prompt strategy); version matches the plugin's own declared `^7.4.1` range.
- **No `baseUrl`:** TS 6.0.3 emits TS5101 (deprecated in TS 6, removed in TS 7); `paths` alone resolve relative to the tsconfig.
- **`registerType: 'prompt'`** never auto-reload (PITFALLS.md:320) — form app must not reload mid-edit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `workbox-window` dependency**
- **Found during:** Task 3 (PWA shell wiring)
- **Issue:** Build failed: `Rolldown failed to resolve import "workbox-window" from "/@vite-plugin-pwa/virtual:pwa-register"` — the prompt-strategy virtual module imports Workbox's window client, which is not bundled by vite-plugin-pwa itself.
- **Fix:** `pnpm add -D workbox-window` (resolved 7.4.1 — exactly the plugin's declared `workbox-window: ^7.4.1` range). Official Google Workbox package, no postinstall, real repo — no package-legitimacy concern.
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** `pnpm build` emits dist/sw.js; full lint/typecheck/build green
- **Committed in:** ac6f0a5 (Task 3 commit)

**2. [Rule 3 - Blocking] Removed deprecated `baseUrl` from tsconfigs**
- **Found during:** Task 3 (post-shadcn typecheck)
- **Issue:** TS 6.0.3 errors TS5101: `Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0` — the `@/*` alias setup (needed for shadcn init) triggered it.
- **Fix:** Dropped `baseUrl` from tsconfig.json + tsconfig.app.json; `paths` resolve relative to the tsconfig (supported since TS 4.1, and required for TS 7 compatibility).
- **Files modified:** tsconfig.json, tsconfig.app.json
- **Verification:** `pnpm typecheck` green
- **Committed in:** ac6f0a5 (Task 3 commit)

**3. [Rule 3 - Blocking] Non-interactive shadcn init needed path aliases first**
- **Found during:** Task 3 (shadcn init)
- **Issue:** `shadcn init` aborted with "Could not find valid path aliases or package imports for init" — the CLI reads `@/*` from tsconfig before it can scaffold.
- **Fix:** Added `@/*` paths to tsconfig.json + tsconfig.app.json (and vite `resolve.alias`) before re-running init — exactly the plan's "if components.json generation requires it" clause. Also handled shadcn's interactive prompts via continuous-newline stdin (research A6).
- **Files modified:** tsconfig.json, tsconfig.app.json, vite.config.ts (alias added in Task 1, reused)
- **Verification:** shadcn init completed; components.json + utils.ts + 4 UI components generated
- **Committed in:** b95a81e (alias) + ac6f0a5 (tsconfigs)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking)
**Impact on plan:** All three were environment/toolchain blockers on the scaffold path; each fix was the documented solution from the tool's own docs. No scope creep — no extra features, no architectural changes.

## Issues Encountered

- **pnpm install timeout (5 min)** on the 7-package dev-deps install (large tarballs on slow registry connection); retried with a 10-min timeout, completed in 34s on cached store. No code impact.
- **create-vite non-empty-dir prompt:** avoided the destructive "remove existing files" option by scaffolding into a temp dir and copying template files into the repo (same result as "ignore files and continue", deterministic).
- **shadcn 4.16.2 interactive prompts** (component library + preset): piped-newline stdin aborted early on EOF; resolved with `yes ''` continuous-newline stdin. Documented defaults accepted (Base UI, Nova preset).

## Known Stubs

None — the plan's honest scope boundary is respected: per-page watermark repetition and fixture content fidelity are explicitly deferred to plan 01-02's harness (recorded in plan must_haves + ADR 0002), not stubbed here.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for 01-02:** the parity harness consumes this plan's build output (`vite preview`), the fixture routes (`?fixture=invoice-torture|invoice-simple`), and `#print-root` + `.watermark` + `thead` print hooks — all present and verified at shell level.
- **Ready for 01-03:** CI consumes `pnpm lint` / `pnpm typecheck` / `pnpm build` scripts (typecheck added per VALIDATION.md); lockfile committed for `--frozen-lockfile`.
- **Carried notes:** oxlint warning (warn-only) in generated `src/components/ui/button.tsx` logged to deferred-items.md; ADR 0001 (framework) and ADR 0002 (PDF path) artifacts belong to plans 01-02/01-03.

---
*Phase: 01-foundation-spike*
*Completed: 2026-08-07*
