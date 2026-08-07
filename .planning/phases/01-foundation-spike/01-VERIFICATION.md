---
phase: 01-foundation-spike
verified: 2026-08-07T19:10:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:

  - test: "Open the generated torture-fixture PDF (from the harness page.pdf() output, or save/print from the app) in Safari 18.2+ and verify: (1) repeating table headers across pages, (2) 15mm margins, (3) per-page watermark position. Attach a screenshot to docs/adr/0002-pdf-path.md."
    expected: "All three paged-media behaviors render correctly in Safari 18.2+. Failure of any item flips ADR 0002's decision to @react-pdf/renderer 4.5.1 (the documented fallback)."
    why_human: "No Safari/macOS exists in this Linux development environment; @page support landed only in Safari 18.2 and repeating-thead / mm-margin behavior is implementation-dependent. The ADR records this as a PENDING manual acceptance step — it is the deciding gate for the print-CSS decision."

  - test: "Visually review the committed golden baseline tests/fixtures/invoice-torture.preview.png (794x1805, 12.2% non-white): long company name wraps correctly, inline SVG logo renders in the header, DRAFT watermark overlays at top-40% rotated, 18 line items with accented text and wrapping descriptions, totals block at bottom."
    expected: "The fixture renders as a professional A4 invoice layout with no overlapping, clipped, or misplaced elements. The automated guards (non-blank, 794px width, drift-free vs current preview, pixel-parity across projections) all pass — this is the human review Pitfall 5 requires."
    why_human: "The golden image is a committed regression pin; research Pitfall 5 mandates a human visual review step for baselines, and plan 01-02 task 2 explicitly deferred this to the end-of-phase verify gate. Automated checks cannot judge layout aesthetics or clipping."

  - test: "Eyeball the on-screen rendering at http://localhost:4173/?fixture=invoice-torture (pnpm dev or pnpm preview): WYSIWYG screen shows the same DRAFT overlay, logo, and layout that prints."
    expected: "Screen projection matches the print projection visually — the two projections share one DOM (parity by construction) and the harness proves pixel equality; this is the human confirmation of that claim."
    why_human: "Client-rendered React SPA content cannot be seen by curl; the parity harness proves pixel-level equality machine-side, but the planned human_judgment gate (plan 01-01 coverage D2) is visual appearance."
gaps: []
deferred: []
---

# Phase 1: Foundation Spike Verification Report

**Phase Goal:** The two gatekeeping technical decisions (framework, PDF engine) are made against explicit criteria and proven on a realistic invoice, so every later phase builds on a validated foundation.
**Verified:** 2026-08-07T19:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

**Verdict:** The phase goal is achieved in code. All four ROADMAP success criteria hold with behavioral evidence — the parity suite ran green 2× (4/4 tests) in this verification session against the production build, and both ADRs are substantive decision records with the required evidence. Status is `human_needed` only because two planned human gates remain (Safari 18.2+ acceptance, golden-baseline visual review), both explicitly deferred by the plans/VALIDATION.md — not because any automated truth failed.

### Observable Truths

| #   | Truth (ROADMAP SC) | Status | Evidence |
| --- | ------------------ | ------ | -------- |
| 1 | **SC1** — ADR records framework decision (Vite SPA + TanStack Router vs TanStack Start) with deciding evidence | ✓ VERIFIED | `docs/adr/0001-framework.md` (106 lines): verbatim decision line "Vite 8 SPA + TanStack Router 1.170.22 … TanStack Start is rejected; re-adopted only if the product later gains server features"; Start RC-status quote ("considered feature-complete and its API is considered stable. This does not mean it is bug-free…"); TanStack's own Router-alone guidance quoted; no-server-features scope table; alternatives table (Start, react-router-dom); re-adoption trigger. |
| 2 | **SC2** — ADR records PDF path decision (print-CSS primary vs react-pdf) against explicit criteria: Safari paged-media fidelity, per-page watermark positioning, rendering latency vs editing speed | ✓ VERIFIED | `docs/adr/0002-pdf-path.md` (148 lines): verbatim decision line "print-CSS is the primary PDF path. @react-pdf/renderer 4.5.1 is the documented fallback"; criterion (a) Safari @page caniuse citation + PENDING manual acceptance step; (b) measured watermark band counts (2556 page-1, 0 pages ≥ 2 — first-page-only Chromium behavior recorded without overclaiming); (c) zero edit-time cost vs react-pdf full regeneration + render-prop-fires-twice. Measured evidence table (0.0000 / 0.0306 / 0.0367 diff fractions) matches what the harness actually asserts. |
| 3 | **SC3** — Golden-image parity harness proves identical preview/output on fixture documents (long names, 12+ items, accented text, logo, watermark) and runs in dev and CI | ✓ VERIFIED (behavioral) | Ran `pnpm exec playwright test tests/parity.spec.ts` **twice in this session — 4/4 passed both runs** (31.0s, 15.2s) against the production build (`vite preview :4173`): preview==print projection (0.0000), print==PDF page 1 (0.0306 < 0.05), pages ≥ 2 with thead-strip-cropped break-shift search (0.0367 < 0.06), pagination ≥ 2 pages, watermark band page-1 ≥ 500 floor with 0 on pages ≥ 2 (3× ratio), logo band ≥ 1000 (#1d4ed8 pixels), repeated thead, baseline sanity + drift-free vs committed golden. Runs in dev (`pnpm test` script) and CI (ci.yml `pnpm test` step). |
| 4 | **SC4** — Scaffold (Vite SPA, TypeScript strict, Tailwind v4, shadcn/ui, TanStack Router, Dexie, vite-plugin-pwa) boots, deploys as static files, has green CI baseline | ✓ VERIFIED (behavioral) | Ran `pnpm lint` (0 errors; 1 pre-existing warn in generated shadcn button — documented in deferred-items.md), `pnpm typecheck` (clean), `pnpm build` (emits dist/ + `dist/sw.js`, `dist/manifest.webmanifest`, `dist/favicon.svg`). TS `~6.0.3` strict (`tsconfig.app.json` `"strict": true`), Tailwind v4 (`@tailwindcss/vite` 4.3.3), shadcn/ui base-nova (`components.json` + button/input/label/card + `cn()`), TanStack Router 1.170.22 (code-based routes), Dexie 4.4.4 `version(1)` stub, vite-plugin-pwa 1.3.0 `registerType: 'prompt'`. App boots (harness navigated `/?fixture=invoice-torture`, `#print-root` rendered, logo `naturalWidth > 0`). `ci.yml` valid YAML: frozen-lockfile install → lint → typecheck → build → chromium install → parity, artifact upload on failure, `UPDATE_BASELINES` absent. Exact CI command sequence ran green locally. |

**Score:** 4/4 truths verified (0 present, behavior-unverified — SC3/SC4 behavior exercised by the running suite and build)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `docs/adr/0001-framework.md` | Framework ADR w/ evidence | ✓ VERIFIED | 106 lines; full Context/Decision/Evidence/Consequences; decision line exact |
| `docs/adr/0002-pdf-path.md` | PDF-path ADR w/ criteria + evidence | ✓ VERIFIED | 148 lines; criteria a/b/c with outcomes; measured evidence table; PENDING Safari step |
| `playwright.config.ts` | Harness config | ✓ VERIFIED | webServer `pnpm preview --port 4173 --strictPort`, chromium project, `deviceScaleFactor: 1`, outputDir tests/artifacts/ |
| `tests/parity.spec.ts` | 3 assertion groups + baseline | ✓ VERIFIED | 233 lines; 4 tests; all calibrated constants documented with measured distributions |
| `tests/helpers/raster.ts` | Rasterizer + normalize seam | ✓ VERIFIED | 165 lines; pdfjs-dist legacy build + @napi-rs/canvas; bilinear `normalize()`; `countPixelsInRange` w/ blue-dominance discriminator |
| `tests/fixtures/invoice-torture.preview.png` | Committed golden baseline | ✓ VERIFIED | PNG 794×1805 RGBA, non-white 12.21% (machine-measured this session); committed; guards pass |
| `.github/workflows/ci.yml` | CI baseline workflow | ✓ VERIFIED | Valid YAML; 5 gates in order; frozen lockfile; artifact upload; no baseline write |
| `package.json` | Pinned scripts/deps | ✓ VERIFIED | `test`, `test:update`; vite 8.2.x, TS ~6.0.3, router 1.170.22, dexie 4.4.4, tailwind 4.3.3, pwa 1.3.0, playwright 1.62.1, pdfjs-dist 6.2.108; no zod/zustand/react-pdf/dnd-kit |
| `vite.config.ts` | react + tailwind + VitePWA | ✓ VERIFIED | `registerType: 'prompt'` (never autoUpdate); manifest; workbox cleanup; `@` alias |
| `src/components/DocumentPage.tsx` | Single shared render component | ✓ VERIFIED | 142 lines; `id="print-root"`, logo img `.document-logo`, watermark overlay, repeating thead, integer-minor totals |
| `src/document/fixtures.ts` | Torture + simple fixtures | ✓ VERIFIED | torture: 18 items (≥12), accents, data-URL SVG logo, draft watermark; simple: 5 items, no logo/watermark; synthetic only |
| `src/styles/print.css` | Print projection stylesheet | ✓ VERIFIED | `@page A4 margin 0`, watermark overlay (global), visibility isolation, `table-header-group`, `break-inside: avoid`, `print-color-adjust: exact` |
| `src/document/types.ts` | Pure DocumentModel | ✓ VERIFIED | JSON-serializable, integer minor units, `logo: string \| null`, `watermark: 'draft' \| null` |
| `src/router.ts` + routes | TanStack Router + whitelist | ✓ VERIFIED | Code-based routes; `?fixture=` whitelisted against FIXTURE_MAP keys, fallback to invoice-simple; raw strings never reflected |
| `src/db/db.ts`, `src/app/pwa.ts` | Dexie stub + PWA shell | ✓ VERIFIED | `version(1).stores({})`; `registerSW` prompt + `storage.persist()` |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | -- | ------ | ------- |
| `routes/index.tsx` | `DocumentPage.tsx` | import + render `<DocumentPage model={FIXTURE_MAP[key]} />` | ✓ WIRED | Verified by code read + behavioral: harness loaded the route, logo/watermark rendered |
| `main.tsx` | `print.css` | global `import './styles/print.css'` | ✓ WIRED | Same DOM printed as screened — parity by construction |
| `routes/index.tsx` | `FIXTURE_MAP` | whitelist `FIXTURE_KEYS.has(raw)` | ✓ WIRED | Unknown keys fall back to invoice-simple; T-01-01 mitigation in place |
| `tests/parity.spec.ts` | production build | `vite preview :4173` webServer + `page.goto('/?fixture=invoice-torture')` | ✓ WIRED | Suite ran green against the real build — the parity contract targets what ships |
| `tests/helpers/raster.ts` | diffs | every projection through `normalize()` 794px seam | ✓ WIRED | Single scale-normalization path (Pitfall 3) |
| `ci.yml` | package.json scripts | byte-identical commands `pnpm lint/typecheck/build/test` | ✓ WIRED | CI proves the same gates the developer runs |
| `ci.yml` | baseline write path | `UPDATE_BASELINES` absent (grep-verified) | ✓ WIRED | Baselines committed-only; `pnpm test:update` is the sole local write path |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `DocumentPage.tsx` | `model` (prop) | `FIXTURE_MAP[key]` ← whitelisted `?fixture=` ← committed `fixtures.ts` | Yes — 18 items, accents, data-URL SVG logo, watermark all render | ✓ FLOWING (proven behaviorally: 2004 logo px, 2556 watermark px, 2 PDF pages, table rows rendered) |
| `routes/index.tsx` | `key` | `new URLSearchParams(...).get('fixture')` | Whitelist lookup, real fallback, no empty/static default | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| SC3 parity: preview==print==PDF, pagination, watermark/logo bands, baseline sanity | `pnpm exec playwright test tests/parity.spec.ts` | 4/4 passed (run 1: 31.0s) | ✓ PASS |
| SC3 stability across repeated runs | same command | 4/4 passed (run 2: 15.2s) | ✓ PASS |
| SC4 lint gate | `pnpm lint` | exit 0, 0 errors | ✓ PASS |
| SC4 typecheck gate | `pnpm typecheck` | exit 0 | ✓ PASS |
| SC4 build → static dist | `pnpm build` | dist/index.html + sw.js + manifest.webmanifest emitted | ✓ PASS |
| Golden baseline sanity | PNG read: 794×1805, non-white 12.21% | Non-blank, correct width | ✓ PASS |
| CI YAML validity + no baseline write | `python3 yaml.safe_load` + `grep UPDATE_BASELINES` | YAML OK; flag absent | ✓ PASS |

### Probe Execution

No probes declared in PLAN/SUMMARY for this phase (no `scripts/*/tests/probe-*.sh`); the parity suite is the phase's executable proof and was run directly in Step 7b. SKIPPED by absence.

### Requirements Coverage

Phase 1 intentionally maps no requirement IDs — REQUIREMENTS.md states: "Phase 1 (Foundation Spike) is a blocking feasibility spike and intentionally maps no requirements — it gates all other phases." The plan frontmatter `requirements:` fields are spike labels referencing ROADMAP SCs (e.g. "spike (ROADMAP Phase 1 SC4: scaffold boots)"), not REQUIREMENTS.md IDs. No IDs to cross-reference; no orphaned requirements. All 61 v1 requirements remain Pending for later phases — correct per the roadmap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | Debt markers (TBD/FIXME/XXX/PLACEHOLDER) | — | None found in src/, tests/, docs/, .github/ |
| — | — | `dangerouslySetInnerHTML`/`InnerHTML` | — | 0 in src/ (grep-verified) |
| — | — | Empty returns / stub components | — | None — every component renders real content |
| `src/components/ui/button.tsx` | 58 | `react/only-export-components` (warn-only, generated) | ℹ️ Info | Pre-existing shadcn output; tracked in deferred-items.md for Phase 4 |
| Review findings (01-REVIEW.md) | WR-01..05, IN-01..05 | See 01-REVIEW.md | ⚠️ Info | Non-blocking for this phase's SCs: CI grep-gate claim overstatement (WR-01), `storage.persist()` rejection (WR-02), PWA manifest icons (WR-03), artifact-upload edge (WR-04), harness NaN edge (WR-05), orphaned assets/README/db.ts-never-imported/duplicate-keys/packageManager-pin (IN-01..05). None break SC1–4; WR-03/IN-03 are Phase 6/Phase 2 scope. |

### Human Verification Required

### 1. Safari 18.2+ paged-media acceptance (ADR 0002 deciding gate)

**Test:** Open the generated torture-fixture PDF (from the harness's `page.pdf()` output, or save/print from the app) in Safari 18.2+ and verify: (1) repeating table headers across pages, (2) 15mm margins, (3) per-page watermark position. Attach evidence (screenshot) to docs/adr/0002-pdf-path.md.
**Expected:** All three paged-media behaviors render correctly. Failure of any item flips the decision to @react-pdf/renderer 4.5.1 (documented fallback).
**Why human:** No macOS/Safari in this Linux environment; `@page` landed only in Safari 18.2 (caniuse); repeating-thead/mm-margin behavior is implementation-dependent. Documented PENDING in ADR 0002 and VALIDATION.md — the only open item between the spike and the print-CSS decision being fully closed. Does not block Phase 2 (per plan 01-03 summary).

### 2. Golden-baseline visual review (Pitfall 5)

**Test:** Visually inspect `tests/fixtures/invoice-torture.preview.png` (794×1805, 12.2% non-white): long company name wrapping, inline SVG logo in the header, DRAFT watermark overlay, 18 line items with accented text, totals block.
**Expected:** Professional A4 invoice layout; no clipped/overlapping elements. Automated guards (non-blank, width, drift, cross-projection parity) all pass — this is the human step research Pitfall 5 and plan 01-02 task 2 mandate at the end-of-phase gate.
**Why human:** A committed regression pin; automated checks cannot judge layout aesthetics.

### 3. On-screen fixture rendering (plan 01-01 coverage D2 human gate)

**Test:** Load `http://localhost:4173/?fixture=invoice-torture` (pnpm dev or preview) and eyeball the WYSIWYG screen: DRAFT overlay, logo, layout.
**Expected:** Screen projection visually matches the print projection (one DOM, parity by construction; pixel equality machine-proven).
**Why human:** Client-rendered SPA content is invisible to curl; the planned `human_judgment: true` gate is visual appearance.

### Gaps Summary

**No gaps.** All four ROADMAP success criteria are verified with behavioral evidence (parity suite run green twice this session, all gates green, both ADRs substantive). The status is `human_needed` solely for the three human-verification items above — all explicitly planned gates (Safari acceptance per VALIDATION.md Manual-Only table, golden visual review per Pitfall 5/plan 01-02, on-screen fidelity per plan 01-01 coverage D2). The code review (01-REVIEW.md) surfaced 5 warnings + 5 infos, none of which break this phase's success criteria; they are quality follow-ups (CI grep gate, PWA icons, harness NaN guard, orphaned assets, README, packageManager pin) for later phases or small hardening patches.

---

_Verified: 2026-08-07T19:10:00Z_
_Verifier: the agent (gsd-verifier)_
