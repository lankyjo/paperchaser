# ADR 0002: PDF Output Path — Print-CSS Primary vs react-pdf

**Status:** Accepted
**Date:** 2026-08-07
**Context refs:** ROADMAP Phase 1 SC2/SC3 · RESEARCH.md (Pitfall 2, State of the Art) · VALIDATION.md (Manual-Only Verifications)

## Context

Paperchaser's core promise is PDF output **identical to the on-screen preview**
(ROADMAP SC3 / PRD §6.9). There is no backend: the WYSIWYG canvas is HTML/CSS in
the browser, and all data lives locally. The PDF path therefore has exactly two
candidates:

1. **Print-CSS primary** — the browser's own print pipeline (`window.print()` /
   Playwright `page.pdf()`), rendering the same DOM the screen renders under
   `@media print` + `@page` (parity by construction — RESEARCH Pattern 1).
2. **@react-pdf/renderer 4.5.1** — a second, independent layout engine.

The decision is judged against the three explicit ROADMAP criteria with the
measured evidence from this spike's golden-image parity harness
(`tests/parity.spec.ts`, plan 01-02):

### (a) Safari paged-media fidelity

`@page` support landed only in Safari 18.2 — **not supported in 3.1–18.1**
[caniuse.com/css-paged-media]. Repeating table headers (`display:
table-header-group`) and mm-margin behavior are browser-implementation-dependent
and are **not verifiable in this development environment** (Linux; no
macOS/Safari). This is recorded as a documented manual acceptance step below —
the decision does not claim Safari fidelity from Chromium evidence.

### (b) Per-page watermark positioning

The DRAFT watermark is an absolutely-positioned element inside the A4 page block
(`top: 40%`, `rotate(-30deg)`, `opacity: 0.15`, class `.watermark`), rendered by
the shared `DocumentPage` component in **both** projections. The Chromium
harness's group-3 band analysis proves it renders in the real `page.pdf()`
output:

- PDF page 1's watermark band (rows 600–860 of the rasterized page — the
  measured landing of `top: 40%` against the page-block's ~1805px element
  height) carries **2556 watermark-blend pixels** (blue-dominant, tolerance
  ±25 of the computed #1d4ed8-at-15%-over-white blend) — above the calibrated
  floor of 500.
- Pages ≥ 2 carry **0 watermark pixels** (max across pages ≥ 2 = 0, below the
  1/3 ratio floor) — **measured: Chromium does NOT repeat a single
  absolutely-positioned element across paginated pages** in this layout.

Per-page repetition across pages ≥ 2 is therefore **not met** by Chromium's
print pipeline for a single positioned element, and it is the deciding check of
the Safari 18.2+ manual acceptance step below. Phase 3's per-page page-block
rendering (research Pitfall 4) owns the repetition implementation once the
builder has real page structure. The parity contract (preview == PDF on the
fixture) holds for page 1, with the first-page-only limitation recorded here —
the ADR claims only what the bands prove.

### (c) Rendering latency vs editing speed

Print-CSS costs **zero at edit time** — the browser paginates at print time, and
editing touches only the DOM. react-pdf regenerates the **full PDF per change**
and requires debouncing (research STACK.md §PDF).

## Decision

**Decision: print-CSS is the primary PDF path. @react-pdf/renderer 4.5.1 is the
documented fallback, adopted only if the Safari 18.2+ paged-media acceptance
steps (below) fail.**

The harness proves the parity contract holds in Chromium today: preview and the
print projection are pixel-identical (0.0000 diff fraction), and the real
`page.pdf()` output matches the print projection per page within calibrated
rasterizer noise (page 1: 0.0306; pages ≥ 2: 0.0367 with the repeated-thead
strip excluded and the row-boundary break shift accounted for — see Evidence).

## Consequences

- **Two projections, one DOM stays.** Phase 3 builds the print stylesheet, never
  a react-pdf tree — parity by construction remains the architecture.
- **The document model stays renderer-agnostic pure data** (`src/document/`,
  Phase 2 owns the real model). Either renderer consumes the same model.
- **The fallback flip trigger is the Safari manual acceptance failure.** If the
  Safari 18.2+ paged-media steps fail (repeating headers, 15mm margins, per-page
  watermark), react-pdf 4.5.1 becomes the projection — implemented from the same
  pure model, never as a parallel HTML lookalike (Pitfall 2).
- **15mm margins are enforced by the A4 page block's padding, not the `@page`
  margin box.** With `@page margin: 15mm` AND the page block's 15mm padding the
  content lands at 30mm — a measured double offset (plan 01-02 calibration). The
  page block carries the padding and `@page` margin is 0; the rendered output is
  visually identical to a 15mm-margin document. The Safari acceptance step
  verifies the visual margins.

## Evidence

Measured by this plan's golden-image parity harness
(`pnpm exec playwright test tests/parity.spec.ts`, fixture `invoice-torture`,
rasterized via pdfjs-dist 6.2.108 legacy build, pixelmatch threshold 0.3):

| Metric | Measured | Asserted |
|---|---|---|
| Preview vs print projection, diff fraction | **0.0000** | < 0.01 |
| Print projection vs PDF, page 1, diff fraction | **0.0306** | < 0.05 |
| Print projection vs PDF, pages ≥ 2, diff fraction (thead strip excluded + break shift) | **0.0367** | < 0.06 |
| Watermark blend pixels, page 1 band (rows 600–860) | **2556** | ≥ 500 |
| Watermark blend pixels, max over pages ≥ 2 | **0** | page 1 > 3× |
| Logo brand-color pixels, page 1 top-12% band (#1d4ed8 ± 20) | **2004** | ≥ 1000 |
| Repeated-thead separator pixels, page 2 top strip | **61** | ≥ 30 |
| PDF pages on the 18-item torture fixture | **2** | ≥ 2 |

The 0.03–0.04 per-page diff fractions are the cross-rasterizer glyph
anti-aliasing floor (pdfjs renders the PDF's embedded fonts with its own
rasterizer; Chromium renders the screenshot) — not content drift; a genuinely
shifted or broken render exceeds the calibrated constants.

Supporting facts:

- **`page.pdf()` is Chromium-only** — WebKit/Firefox throw (research A1). CI
  scope is Chromium parity; Safari fidelity is the manual acceptance step.
- **react-pdf is a second layout engine** (Yoga + pdfkit with Knuth–Plass
  hyphenation, `wrap`/`fixed`/`render-twice` semantics, and the open force-fit
  pagination bug class — research Pitfall 2), whose output must be kept in sync
  with the HTML preview forever.
- **react-pdf's `render` prop fires twice** (react-pdf v4 docs) — a per-render
  cost on top of full-PDF regeneration.
- **Safari `@page`**: not supported 3.1–18.1, supported 18.2+ [caniuse].
- **`print-color-adjust: exact`** is Baseline 2025 [MDN] — logos, watermark and
  brand colors print accurately everywhere.
- **Parity fixes the harness forced (plan 01-02 deviations):** the app-shell was
  `display:none` in print (destroying the document subtree — now visibility-only
  hiding with neutralized layout); the watermark was print-only styled (an
  in-flow "DRAFT" line on screen — now a shared overlay in both projections);
  the print stylesheet relied on an absolute-position flip that the page block's
  inline `position: relative` overrides — the block now stays in flow with
  `@page margin: 0`.

## Manual Acceptance Step (PENDING — no Safari 18.2+ in the development environment)

From VALIDATION.md Manual-Only Verifications:

> Open the generated torture-fixture PDF (save/print from the app, or the
> harness's `page.pdf()` output) in **Safari 18.2+**; verify:
> 1. repeating table headers across pages,
> 2. 15mm margins,
> 3. per-page watermark position.
> Attach evidence (screenshot) to this ADR.
> **Status: PENDING — no Safari 18.2+ in the development environment.**

This is the deciding gate for the fallback: failure of any of the three items
flips the decision to @react-pdf/renderer 4.5.1.
