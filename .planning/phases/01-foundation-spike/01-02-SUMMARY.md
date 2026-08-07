---
phase: 01-foundation-spike
plan: 02
subsystem: testing
tags: [playwright, pixelmatch, pdfjs-dist, @napi-rs/canvas, pngjs, golden-image, print-css, adr]

# Dependency graph
requires:
  - phase: 01-foundation-spike (01-01)
    provides: dist/ production build, ?fixture= routes, #print-root + .watermark + thead print hooks, FIXTURE_MAP torture fixture
provides:
  - Golden-image parity harness (Playwright + pixelmatch + pdfjs-dist) proving preview == print projection == PDF per page on the torture fixture, running against the production build (ROADMAP SC3)
  - Committed golden baseline (invoice-torture.preview.png) with blank/wrong-size drift guards and an explicit UPDATE_BASELINES update path (Pitfall 5)
  - ADR 0002 recording the print-CSS primary PDF decision against the three ROADMAP criteria with measured harness evidence + PENDING Safari 18.2+ manual acceptance step (ROADMAP SC2)
  - Print-path bug fixes the harness forced: shell display:none destroyed the print subtree; watermark was print-only styled (in-flow 'DRAFT' line on screen); @page margin 0 + page-block padding so content sits at exactly 15mm in all projections
affects: [01-03 (CI consumes pnpm test + UPDATE_BASELINES enforcement), phase 03 render pipeline (print stylesheet, per-page watermark implementation), phase 06 PDF delivery]

# Actuals (#2632) — pairs with the plan estimate (52000 tokens @ low confidence).
# Scale: chars/4 over the realized committed diff (31289 chars, excluding the binary PNG).
actuals:
  tokens: 7822     # chars/4 over realized diff (plan over-estimated ~6.6x — the harness iterations were probe-led, not committed)
  tasks: 3         # tasks completed
  commits: 3       # commits made (plus 2 pre-existing config.json / research-cache files left untouched)

# Tech tracking
tech-stack:
  added: [@napi-rs/canvas 1.0.3 (pdfjs-dist 6.x Node rasterization)]
  patterns:
    - "Harness scale-normalization seam: normalize() to 794px (A4@96dpi) is the single path every diff goes through (Pitfall 3)"
    - "Break-aware per-page comparison: pages >= 2 crop the repeated thead strip and search a bounded row-boundary break shift (paged-media features absent from the continuous projection)"
    - "Blue-dominance discriminator (b - r > 8) for blend-color counting — rejects neutral-gray AA of table text"
    - "page.pdf() must be called while print media is emulated — resetting to screen changes the printed output"

key-files:
  created: [playwright.config.ts, tests/parity.spec.ts, tests/helpers/raster.ts, tests/fixtures/invoice-torture.preview.png, docs/adr/0002-pdf-path.md]
  modified: [src/styles/print.css, package.json, pnpm-lock.yaml, .gitignore]

key-decisions:
  - "Print-CSS primary PDF path with @react-pdf/renderer 4.5.1 as the documented fallback, flip trigger = Safari 18.2+ manual acceptance failure (ADR 0002)"
  - "pdfjs-dist Node rasterization via @napi-rs/canvas 1.0.3 + the legacy build (the plan's 'canvas' name was wrong for pdfjs 6.x; modern build throws DOMMatrix in Node)"
  - "@page margin 0 + page-block 15mm padding (the print stylesheet's absolute-flip is defeated by the block's inline position:relative; @page margin 15mm + padding = 30mm double offset)"
  - "Watermark overlay styled globally (both projections), not print-only — screen shows the WYSIWYG draft mark"
  - "Projections captured as #print-root element boxes, not fullPage (app-shell chrome must not be part of the parity contract)"

patterns-established:
  - "Harness asserts evidence the ADR cites — measured values live in the spec constants with motivating distributions"
  - "Baselines committed deliberately; UPDATE_BASELINES=1 is the only write path; CI never sets it (plan 01-03 enforces)"

requirements-completed: ["spike (ROADMAP Phase 1 SC3: golden-image parity harness proves identical preview/output on fixture documents; SC2: ADR 0002 records the PDF path decision against explicit criteria)"]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "Golden-image parity harness: three captures (preview, print projection, real page.pdf rasterized per page) pixel-diffed through the normalize() 794px seam; three assertion groups (preview-vs-print with logo assertion, print-vs-PDF per page, pagination + watermark/logo bands + baseline sanity); runs against the production build via vite preview"
    verification:
      - kind: integration
        ref: "pnpm exec playwright test tests/parity.spec.ts — 4/4 pass (3 consecutive fixture runs + full suite with baseline active); measured preview-vs-print diff 0.0000, PDF page 1 0.0306, pages >=2 0.0367"
        status: pass
    human_judgment: false
  - id: D2
    description: "Committed golden baseline invoice-torture.preview.png (794x1805, non-white 12.2%) with blank/wrong-width guards + drift assertion on every run; explicit UPDATE_BASELINES=1 write path only"
    verification:
      - kind: integration
        ref: "tests/parity.spec.ts baseline test — sanity + drift asserted in every full-suite run; UPDATE_BASELINES run wrote the golden"
        status: pass
    human_judgment: false
  - id: D3
    description: "ADR 0002 — print-CSS primary PDF decision against the three ROADMAP criteria (Safari paged-media fidelity, per-page watermark, latency) with measured harness evidence and the PENDING Safari 18.2+ manual acceptance step"
    verification:
      - kind: manual_procedural
        ref: "docs/adr/0002-pdf-path.md — Decision: line 1, Safari 14 mentions, criteria a/b/c covered, evidence table cites measured counts"
        status: pass
    human_judgment: true
    rationale: "The deciding gate for the ADR is Safari 18.2+ paged-media fidelity (repeating headers, mm margins, per-page watermark) — not verifiable in this Linux environment; the manual acceptance step is PENDING per VALIDATION.md. Chromium parity is fully automated; the Safari criterion requires a human with a real Safari 18.2+."

# Metrics
duration: 33min
completed: 2026-08-07
status: complete
---

# Phase 1 Plan 2: Golden-Image Parity Harness + PDF-Path ADR Summary

**The golden-image parity harness (Playwright + pixelmatch + pdfjs-dist/@napi-rs/canvas) proves preview == print projection == real PDF output on the torture fixture within calibrated thresholds — 0.0000 preview-vs-print, 0.0306 page-1 and 0.0367 pages-≥2 print-vs-PDF diff fractions — with a committed, drift-guarded golden baseline, plus ADR 0002 recording print-CSS as the primary PDF path against the three ROADMAP criteria with that measured evidence.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-08-07T16:50:00Z
- **Completed:** 2026-08-07T17:22:54Z
- **Tasks:** 3
- **Files modified:** 9 (playwright.config.ts, tests/parity.spec.ts, tests/helpers/raster.ts, tests/fixtures/invoice-torture.preview.png, docs/adr/0002-pdf-path.md, src/styles/print.css, package.json, pnpm-lock.yaml, .gitignore)

## Accomplishments

- **ROADMAP SC3 proven end-to-end:** the harness captures all three projections of the torture fixture (long company name, 18 line items, accents, data-URL logo, DRAFT watermark) against the production build (`vite preview :4173`), and asserts preview == print projection (0.0000 diff fraction — pixel-perfect), print projection == rasterized PDF per page (0.0306 / 0.0367, the cross-rasterizer AA floor), pagination (2 pages), watermark presence on page 1 (2556 blend pixels) with zero on pages ≥ 2, logo survival (2004 brand-color pixels), repeated thead (61 separator pixels), and baseline sanity (794px wide, 12.2% non-white, drift-free).
- **The harness caught and drove the fix of three real print-path bugs** in plan 01-01's output: the app-shell's `display: none !important` was destroying the entire `#print-root` subtree in print (blank-document risk); the watermark was styled only inside `@media print` (the screen projection rendered an in-flow "DRAFT" line, shifting the layout one line and missing the overlay); and the print stylesheet relied on an absolute-position flip that the page block's inline `position: relative` overrides, with `@page margin 15mm` + element padding producing a 30mm content offset. All three fixed in `src/styles/print.css` (deviation Rule 1); the ADR records them as evidence of the harness's value.
- **Baseline discipline (Pitfall 5):** the golden `invoice-torture.preview.png` was generated deliberately via the explicit `UPDATE_BASELINES=1 pnpm exec playwright test -g baseline` path and committed with the fixture name; every subsequent suite run asserts it is non-blank (>1% non-white), exactly 794px wide, and drift-free against the current preview. CI never writes baselines (plan 01-03 enforces).
- **ADR 0002 accepted:** print-CSS is the primary PDF path with `@react-pdf/renderer` 4.5.1 as the documented fallback, decided against the three ROADMAP criteria — Safari paged-media fidelity (only 18.2+, PENDING manual acceptance step), per-page watermark (measured first-page-only Chromium behavior, 2556 vs 0 blend pixels), and latency (zero edit-time cost vs react-pdf full regeneration). The ADR cites exactly what the bands prove and no more.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement the golden-image parity harness** - `c655f23` (feat)
2. **Task 2: Calibrate thresholds and generate + commit the golden baseline** - `095415f` (feat)
3. **Task 3: Write ADR 0002 — PDF path decision** - `55967f8` (docs)

**Plan metadata:** (final metadata commit after this SUMMARY)

## Files Created/Modified

- `playwright.config.ts` - webServer `pnpm preview --port 4173 --strictPort`, chromium project (Desktop Chrome), `deviceScaleFactor: 1`, `outputDir: tests/artifacts/`
- `tests/helpers/raster.ts` - THE scale-normalization seam (Pitfall 3): `normalize()` bilinear 794px resize, `rasterizePdf()` via pdfjs-dist legacy build + @napi-rs/canvas, `diffFraction()` pixelmatch wrapper (AA excluded), `countPixelsInRange()` band counter with optional blue-dominance discriminator
- `tests/parity.spec.ts` - four tests: preview-vs-print (with logo visibility + naturalWidth assertions), print-vs-PDF per page (page 1 exact; pages ≥ 2 crop the repeated thead strip and search the bounded break shift), pagination + watermark/logo bands + repeated thead, baseline sanity + drift; all calibrated constants documented with measured distributions
- `tests/fixtures/invoice-torture.preview.png` - committed golden baseline (794×1805, 12.2% non-white)
- `docs/adr/0002-pdf-path.md` - print-CSS primary decision, three criteria with outcomes, measured evidence table, react-pdf fallback trigger, PENDING Safari acceptance step
- `src/styles/print.css` - the three harness-forced parity fixes (visibility-only shell hiding + layout neutralization, global watermark overlay, `@page margin: 0` + in-flow page block)
- `package.json` - `test` and `test:update` scripts
- `pnpm-lock.yaml` - @napi-rs/canvas 1.0.3 + deps
- `.gitignore` - `tests/artifacts/`

## Decisions Made

- **print-CSS primary, react-pdf 4.5.1 fallback** — recorded in ADR 0002 with the harness's measured evidence; the flip trigger is Safari 18.2+ acceptance failure.
- **@napi-rs/canvas, not `canvas`, for pdfjs Node rasterization** — pdfjs-dist 6.2.108's own declared optional dependency (verified in its source: `require("@napi-rs/canvas")`); the legacy build is required (the modern build throws `DOMMatrix is not defined` in Node).
- **`@page margin: 0`, margins enforced by the page block's 15mm padding** — the inline `position: relative` on `#print-root` defeats any stylesheet absolute flip, and `@page margin 15mm` + element padding double-offsets content to 30mm; the page block in flow with `margin: 0` places content at exactly 15mm in every projection.
- **Watermark overlay styled globally** — the WYSIWYG screen canvas must show the same draft mark as print (the plan's own context requires both projections to share it).
- **Element-box captures, not fullPage** — the app-shell chrome (gray background, 24px padding) is part of the page in screen media but not the PDF; the `#print-root` element box is the only geometry that aligns with a 794px PDF page.
- **`page.pdf()` must run while print media is emulated** — a reset to screen first changes the printed output (measured 0.0778 vs 0.0306 diff fraction).
- **Break-aware page-≥2 comparison** — the repeated thead and `break-inside: avoid` page-break placement are paged-media features absent from the continuous projection; cropping the thead strip and searching the bounded break shift aligns them (page 1 keeps a strict dy=0 comparison, so global layout drift cannot hide).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `.app-shell { display: none }` destroyed the print document**
- **Found during:** Task 1 (harness first run)
- **Issue:** print.css hid the app shell with `display: none !important`, but `#print-root` lives INSIDE the shell — the entire document subtree was unrendered in print. Playwright: "element is not visible"; the PDF would have been blank/empty.
- **Fix:** hide the shell via `visibility: hidden` (which `#print-root` and children override back to visible) and neutralize its print layout (`padding: 0 !important; min-height: 0 !important`) so it cannot push the document 24px down the page.
- **Files modified:** src/styles/print.css
- **Verification:** print projection screenshot renders the full document; PDF page 1 content at 15mm
- **Committed in:** c655f23 (Task 1)

**2. [Rule 1 - Bug] Watermark styled print-only — screen projection showed in-flow "DRAFT"**
- **Found during:** Task 1 (preview-vs-print diff — 12% + 16px height delta)
- **Issue:** `.watermark` styles (absolute, top 40%, rotate, opacity 0.15) lived only inside `@media print`; on screen the watermark div was a plain in-flow text line at the top of the document, shifting the whole layout one line (16px) and omitting the overlay.
- **Fix:** moved the watermark overlay styling to global scope — both projections render the same absolute rotated 15%-opacity draft mark (the WYSIWYG canvas shows the mark; parity restored).
- **Files modified:** src/styles/print.css
- **Verification:** preview-vs-print diff dropped from 0.1243 to 0.0000; heights equal
- **Committed in:** c655f23 (Task 1)

**3. [Rule 1 - Bug] Print stylesheet's absolute-flip defeated; content at 30mm double offset**
- **Found during:** Task 1 (PDF geometry probe)
- **Issue:** `#print-root`'s inline `position: relative` beats the stylesheet `position: absolute` (inline wins), so the print "flip" never applied; with `@page margin 15mm` + element padding 15mm the PDF content landed at 30mm from the page corner, translated by (15mm, 15mm) from the screen projection.
- **Fix:** kept the page block in flow, set `@page { margin: 0 }`, and let the block's own 15mm padding place content at exactly 15mm in all three projections (visually identical to an @page-margin document; recorded honestly in the ADR).
- **Files modified:** src/styles/print.css
- **Verification:** PDF page 1 first-non-white at (58,61) vs target (57,57); per-page diff fractions at the AA-noise floor
- **Committed in:** c655f23 (Task 1)

**4. [Rule 3 - Blocking] pdfjs 6.x needs `@napi-rs/canvas` + the legacy build, not the plan's `canvas`**
- **Found during:** Task 1 (rasterizer setup)
- **Issue:** the plan named the `canvas` package as the Node rasterization devDependency, but pdfjs-dist 6.2.108 requires `@napi-rs/canvas` (its own declared optional dependency, verified in source); the modern `pdf.mjs` build throws `DOMMatrix is not defined` under Node.
- **Fix:** installed `@napi-rs/canvas` 1.0.3 (prebuilt binaries, no native build step, official napi-rs package — the same one pdfjs itself declares) and used the `legacy/build/pdf.mjs` build. This is the plan's documented primary path (pdfjs in the Node test process), not the in-page fallback.
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** rasterizer smoke test rendered a PDF page to PNG; suite green
- **Committed in:** c655f23 (Task 1)

**5. [Calibration] Watermark band position differs from the plan's nominal strip**
- **Found during:** Task 2 (band calibration)
- **Issue:** the plan's "top 40% ± 15% of page height" band (rows 281–618) misses the actual watermark — `top: 40%` resolves against the ELEMENT height (~1805px), landing the rotated text at rows ~600–880 of the rasterized PDF page (peak 740).
- **Fix:** calibrated the band to the measured distribution (rows 600–860) and documented why in the spec; the plan explicitly assigns band constants to task-2 calibration from measured distributions.
- **Files modified:** tests/parity.spec.ts
- **Verification:** page-1 band count 2556 (blue-dominant) ≥ floor 500; pages ≥ 2 = 0
- **Committed in:** 095415f (Task 2)

**6. [Calibration] Blue-dominance discriminator needed in the watermark blend count**
- **Found during:** Task 2 (page-2 false positives)
- **Issue:** per-channel tolerance alone counted 652 "blend" pixels on page 2 — neutral-gray anti-aliasing of near-black table text sliding into the light-blue range. The plan warned the blend range could be ambiguous against table content and offered the page-1-floor fallback.
- **Fix:** added `b - r > 8` (blue dominance) to the watermark counter — page-2 count drops to 0, page-1 stays 2556. The ADR's "pages ≥ 2 = 0" claim rests on this discriminator.
- **Files modified:** tests/helpers/raster.ts, tests/parity.spec.ts
- **Verification:** full-page strict scan: page 1 2556 blend px, page 2 0
- **Committed in:** 095415f (Task 2)

**7. [Harness finding] `page.pdf()` output depends on the emulateMedia state at call time**
- **Found during:** Task 2 (threshold calibration — measured 0.0778 vs probe 0.0306)
- **Issue:** the harness reset media to `screen` before `page.pdf()`; the printed output then differed from the print projection (0.0778 vs 0.0306 diff fraction). Calibration must target the sequence the harness actually runs.
- **Fix:** generate the PDF while print media is still emulated (each test uses a fresh page, so no cross-test leakage); documented in the spec.
- **Files modified:** tests/parity.spec.ts
- **Verification:** page-1 diff back at 0.0306; suite green
- **Committed in:** c655f23 (Task 1)

---

**Total deviations:** 7 auto-fixed (4 Rule 1 bugs, 1 Rule 3 blocker, 2 calibration refinements the plan explicitly delegated to task 2)
**Impact on plan:** All fixes were necessary for the parity contract to hold — the harness did its job (it IS the validation architecture) and the bugs it caught were real print-path defects from plan 01-01. No scope creep: no new features, no architectural changes beyond the ADR's own decision.

## Issues Encountered

- **`playwright install --with-deps` failed** (sudo password required for system deps on this headless box) — plain `playwright install chromium` downloaded the headless shell and worked; the harness never needed the extra system packages.
- **pixelmatch 7.x is ESM-only** and pngjs is CJS — interop handled in raster.ts imports (Playwright's esbuild transform bridges it).
- **`__dirname` undefined in the ESM spec** — resolved via `import.meta.url` + `fileURLToPath`.
- **First chained verify command hit the 180s tool timeout** (typecheck + build + `playwright --list`) — steps run separately thereafter; no code impact.

## Known Stubs

None — the ADR's PENDING Safari manual acceptance step is a deliberate, documented external verification (VALIDATION.md Manual-Only), not a stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for 01-03 (CI):** `pnpm test` (parity) and `pnpm test:update` (baseline write) scripts exist; the suite is green and stable; `UPDATE_BASELINES` is the only baseline write path, and CI must never set it — plan 01-03 enforces exactly that; `--frozen-lockfile` works (pnpm-lock.yaml updated with @napi-rs/canvas).
- **Ready for Phase 3 (render pipeline):** print.css geometry contract is now harness-pinned (content at 15mm in all projections, in-flow page block, global watermark overlay); any render-affecting change must re-run the parity suite (PITFALLS.md:36).
- **ADR 0002's deciding gate:** the Safari 18.2+ manual acceptance step (repeating headers, 15mm margins, per-page watermark) remains PENDING — it is the only open item between the spike and the print-CSS decision being fully closed.

---
*Phase: 01-foundation-spike*
*Completed: 2026-08-07*

## Self-Check: PASSED

- All 6 key files exist on disk (playwright.config.ts, tests/parity.spec.ts, tests/helpers/raster.ts, golden baseline PNG, ADR 0002, SUMMARY)
- All 3 plan commits present: c655f23 (harness), 095415f (baseline + calibration), 55967f8 (ADR 0002)
- Plan-level verification green: `pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test` — 4/4 tests pass (0 lint errors; 1 pre-existing warn in generated shadcn button, out of scope)
- Suite stable across 3 consecutive runs (fixture subset) + full suite with baseline active
