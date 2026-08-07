---
phase: 01-foundation-spike
reviewed: 2026-08-07T18:50:00Z
depth: standard
files_reviewed: 33
files_reviewed_list:
  - components.json
  - docs/adr/0001-framework.md
  - docs/adr/0002-pdf-path.md
  - .github/workflows/ci.yml
  - .gitignore
  - index.html
  - .oxlintrc.json
  - package.json
  - playwright.config.ts
  - pnpm-workspace.yaml
  - README.md
  - src/app/pwa.ts
  - src/components/DocumentPage.tsx
  - src/components/ui/button.tsx
  - src/components/ui/card.tsx
  - src/components/ui/input.tsx
  - src/components/ui/label.tsx
  - src/db/db.ts
  - src/document/fixtures.ts
  - src/document/types.ts
  - src/lib/utils.ts
  - src/main.tsx
  - src/router.ts
  - src/routes/index.tsx
  - src/routes/__root.tsx
  - src/styles/index.css
  - src/styles/print.css
  - tests/helpers/raster.ts
  - tests/parity.spec.ts
  - tsconfig.app.json
  - tsconfig.json
  - tsconfig.node.json
  - vite.config.ts
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-08-07T18:50:00Z
**Depth:** standard
**Files Reviewed:** 33
**Status:** issues_found

## Summary

Spike foundation: Vite SPA + TanStack Router, print-CSS PDF path with a
golden-image parity harness, PWA shell, and CI gate. The core engineering is
sound — integer-minor-unit money math (no float drift), whitelist-validated
query param with safe fallback, zero raw-HTML injection sites, and a
well-calibrated, honestly-measured parity harness. No blocker-grade defects
were proven: I traced the money arithmetic, the `?fixture=` validation, the
`sampleBilinear` scale-normalization bounds, and the watermark/logo band math
and found them correct. The findings below are enforcement gaps (a security
control claimed in a comment but absent from CI), robustness gaps (unhandled
rejection, harness NaN edge, artifact-upload noise), and hygiene items
(orphaned template assets, stock README, dead module).

## Warnings

### WR-01: False claim — raw-HTML ban is "grep-enforced in CI", but CI has no grep gate

**File:** `src/components/DocumentPage.tsx:11` (and `.github/workflows/ci.yml`)
**Issue:** The comment asserts the `dangerouslySetInnerHTML` ban is "grep-enforced in CI". The workflow (ci.yml) contains only install → lint → typecheck → build → parity steps — no grep anywhere. The ban is enforced today only by one-off manual acceptance commands in `.planning` docs (01-VALIDATION.md). The XSS-via-future-content vector is the project's top threat (PITFALLS.md:427); a future contributor adding `dangerouslySetInnerHTML` would pass CI silently. The comment overstates a control that does not exist as a gate.
**Fix:** Add the gate to the workflow, or correct the comment. Cheapest correct gate in ci.yml after lint:
```yaml
      - run: |
          if grep -rn "dangerouslySetInnerHTML\|innerHTML=" src/ ; then
            echo "raw-HTML injection banned (PITFALLS.md:427)"; exit 1
          fi
```

### WR-02: Unhandled promise rejection from `navigator.storage.persist()`

**File:** `src/app/pwa.ts:19`
**Issue:** `void navigator.storage?.persist?.()` suppresses the returned promise but not its rejection. `persist()` rejects (permission denied, private browsing, non-secure context, older WebKit) → `unhandledrejection` fires in the console. For a module loaded at startup on every page view, that is a guaranteed console error on any browser that refuses persistence — exactly the browsers whose data-eviction risk this call exists to mitigate.
**Fix:**
```ts
navigator.storage?.persist?.().catch(() => {}) // eviction risk is best-effort; ignore refusal
```

### WR-03: PWA manifest has no `icons` — install prompt can never fire

**File:** `vite.config.ts:18-25`
**Issue:** The manifest declares name/display/colors but no `icons` array. Chromium requires at least one 192px and one 512px icon (plus maskable recommended) before an install prompt is offered. For a local-first PWA whose whole point is installability, this silently disables the install surface. `public/icons.svg` exists but is referenced nowhere; `includeAssets: ['favicon.svg']` only pre-caches the tab favicon.
**Fix:** Add icons to the manifest (reuse/extend `public/icons.svg` or add dedicated PNGs):
```ts
manifest: {
  // ...
  icons: [
    { src: 'icons.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    // plus 192/512 PNGs for Chromium's install requirements
  ],
},
```

### WR-04: `upload-artifact` under `if: failure()` fails when the failing step is not the parity test

**File:** `.github/workflows/ci.yml:23-27`
**Issue:** `if: failure()` triggers on ANY job failure (lint, typecheck, build). When those fail, `tests/artifacts/` was never created, and `upload-artifact`'s default `if-no-files-found: error` makes the upload step itself fail — the job then shows two red steps, obscuring the root cause in the CI UI.
**Fix:** `with: { if-no-files-found: warn }` (or scope the condition to the test step):
```yaml
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: parity-diffs
          path: tests/artifacts/
          if-no-files-found: warn
          retention-days: 7
```

### WR-05: Harness produces `NaN` diff fractions when a projection is shorter than the PDF pagination

**File:** `tests/parity.spec.ts:144` and `tests/helpers/raster.ts:83-88`
**Issue:** `cropY(printShot, i * A4_HEIGHT_PX, A4_HEIGHT_PX)` yields a 0-height PNG when `printShot.height <= i * A4_HEIGHT_PX`. pngjs accepts height 0, `pixelmatch` counts 0 pixels, and `diffFraction` computes `0 / (794 * 0)` → `NaN`. `expect(NaN).toBeLessThan(0.06)` then fails with a confusing message. Reachable whenever a future fixture's continuous projection is no taller than one A4 page while `page.pdf()` still paginates to ≥ 2 pages (the `break-inside: avoid` row-push scenario) — the 18-item torture fixture is far from this today, but the harness is the project's own flagged "flakiest seam".
**Fix:** Guard before the loop:
```ts
expect(printShot.height).toBeGreaterThan((pages.length - 1) * A4_HEIGHT_PX)
```
and/or make `diffFraction` throw on `h <= 0` instead of returning NaN.

## Info

### IN-01: Orphaned template assets committed to the repo

**File:** `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`
**Issue:** None of these is referenced by any source file (grep-verified). `react.svg`/`vite.svg` are Vite template leftovers; `hero.png` and `icons.svg` are unreferenced binary/SVG assets. Dead weight and confusing for future contributors scanning the tree.
**Fix:** Delete all four.

### IN-02: README.md is still the stock Vite template README

**File:** `README.md:1-32`
**Issue:** Documents the React Compiler and SWC plugin template options, not this project. Nothing about the app, the harness, `pnpm test:update` (the golden baseline write path), `pnpm preview` dependency for tests, or the PWA. Inconsistent with the repo's otherwise rigorous documentation discipline (ADRs, PITFALLS).
**Fix:** Rewrite to cover commands, the parity contract, and the ADR pointers.

### IN-03: `src/db/db.ts` is never imported — the Dexie version stub never executes

**File:** `src/db/db.ts:8-10`
**Issue:** No module imports this file (grep-verified). The comment's stated intent — "versioning discipline starts with the first schema commit" — means `db.version(1)` should actually run, but tree-shaking drops the module entirely, so no `paperchaser` DB is ever opened by the spike.
**Fix:** Import it as a side effect in `main.tsx` (`import './db/db'`) so the schema commit is real, or delete it until Phase 2.

### IN-04: Duplicate React keys for identical address lines

**File:** `src/components/DocumentPage.tsx:73, 89`
**Issue:** `key={line}` — two identical address lines (e.g., a repeated "Deutschland", or duplicated street lines) produce duplicate keys: React warns and reconciliation on reorder misbehaves.
**Fix:** Index-based keys: `model.company.address.map((line, i) => <div key={i}>{line}</div>)`.

### IN-05: No `packageManager` pin while CI's pnpm version is unpinned

**File:** `package.json:1-47`, `.github/workflows/ci.yml:12`
**Issue:** `pnpm/action-setup@v4` with no `version` input and no `packageManager` field resolves to whatever pnpm the action defaults to. `pnpm-workspace.yaml` relies on `minimumReleaseAgeExclude` (pnpm ≥ 9.15.3); an older pnpm silently ignores the key. Local installs (`corepack`/nvm pnpm) can also drift from CI.
**Fix:** Add `"packageManager": "pnpm@<installed-version>"` to package.json (also documents the engine for the workspace yaml features).

---

_Reviewed: 2026-08-07T18:50:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
