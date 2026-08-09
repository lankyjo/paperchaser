---
phase: 03-render-pipeline
verified: 2026-08-09T11:15:00Z
status: passed
score: 9/10 must-haves verified
behavior_unverified: 1
overrides_applied: 0
human_verification:

  - test: "Click through all 7 template gallery cards in the bench rail"
    expected: "Each template re-renders instantly with a visually distinct identity (colors/fonts/borders/spacing); document content (items, totals, customer) is identical across switches; page structure never changes (same sections, same order)"
    why_human: "Visual distinctness and structural sameness across 7 live switches cannot be asserted by the parity harness (it captures each template independently, not the switch transition)"

  - test: "Branding WYSIWYG flow in the app: add a small PNG logo, set primary/accent colors, switch fonts/header/footer styles, set watermark to Paid on a draft doc"
    expected: "Logo appears in the header; document recolors instantly; re-renders instantly per control; 'PAID' overlay renders in the accent color; reload the page → ALL branding persists per-document (D-01); uploading a 5 MB file shows the inline 'Couldn't load that file…' error with no state change; Remove logo → confirm dialog → logo gone"
    why_human: "The BrandingPanel→model→documentsRepo.put→render loop is wired (code-verified) but no automated test exercises the interactive controls or reload persistence"

  - test: "Watermark overrides: set watermark Draft on a paid-status doc, and Paid on a draft-status doc"
    expected: "Draft forces 'DRAFT' overlay regardless of status (edge-11); Paid forces 'PAID' regardless of status (edge-12); 'auto' on a paid doc renders no watermark (documented DRAFT-only deriveWatermark divergence)"
    why_human: "Edges 11/12 are runtime UI interactions — the unit suite pins only edge-13 (auto+sent → null) and the harness tests the auto/draft path"

  - test: "Page sizes in the browser: switch the bench Select to A5, then A3"
    expected: "Canvas page block narrows to 148mm (A5) / widens to 297mm (A3); Ctrl+P shows the paper size in the browser print dialog; A4 remains the default on load"
    why_human: "The harness proves page.pdf({ format }) geometry, not the CSS named-@page → window.print() paper-size path (Pitfall 2 coupling)"

  - test: "Print preview dialog UX: open 'Print preview' on the torture fixture, then on the simple fixture"
    expected: "Torture: 2 page blocks, 'Page 1 of 2' / 'Page 2 of 2', table header visible at top of page 2, content identical to the canvas; 'Print' opens the browser print dialog; Close works. Simple: exactly 1 block"
    why_human: "Dialog page-count and pixel-parity are automated; the visual stack look and the window.print() interaction need human eyes"

  - test: "Empty-store load: open the app with an empty IndexedDB store, then hard-refresh"
    expected: "An English Minimal invoice renders on the canvas; hard refresh → the SAME document persists (seeded once, idempotent); /?fixture=invoice-torture still renders the torture fixture"
    why_human: "Seed mechanics are unit-tested; the rendered demo document's visual adequacy needs a browser"

  - test: "Unknown query params degrade safely: visit /?template=unknown and /?size=unknown"
    expected: "Both render the minimal template / A4 page (resolver defaults), never an error page, never reflected raw values"
    why_human: "The whitelist's known-key path is exercised by the harness (?template= × 7, ?size= a5/a3); the unknown→default fallback is route code reading window.location with no test"
---

# Phase 3: Render Pipeline Verification Report

**Phase Goal:** Documents render identically on screen and in PDF, controlled by style-only templates and branding — the product's core promise proven while rendering is cheap.
**Verified:** 2026-08-09T11:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **SC1 (TEMP-01/02/03):** user renders with any of 7 templates; switching changes style only, never structure | ✓ VERIFIED | TEMPLATE_REGISTRY has exactly the 7 ids set-equal to the z.enum union (unit: tokens.test.ts "contains exactly the 7 template ids"); pairwise distinctness unit test; DocumentPage template-agnostic (grep `templateId` in DocumentPage/print → 0 hits); header/footer via resolved-style preset map; parity green across all 7 templates; 7 goldens human-approved (03-04 Task 3) |
| 2 | **SC2 (BRND-01..06):** user applies branding (logo, colors, fonts, header/footer, watermark) reflected in the on-screen preview | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | BrandingPanel (logo gate ≤2MB + type allowlist, native color inputs + token presets, font/style selects, watermark radio, reset), wired to model.branding + documentsRepo.put (D-01) and the same object DocumentPage renders; resolveTokens D-02 overlay unit-pinned; watermark three-way resolve present. The interactive control→preview flow has no automated test — see Human Verification |
| 3 | **SC3 (PDF-01..06, BRND-07):** PDF identical to preview — A4 default, optional page sizes, automatic pagination, print margins, high resolution, white page | ✓ VERIFIED | `pnpm test` 6/6 green (behavioral): preview==print < 0.01 and print==PDF < 0.05/0.06 per page for ALL 7 templates; pagination ≥ 2; watermark/logo/thead bands above calibrated floors with derived targets; A5/A3 structural test (width 560/1123 ±2, edge-16/17, thead, watermark dominance); A4 default unit-pinned; 15mm margin contract in pageStyleFor + @page margin 0; BRND-07 `#ffffff` background in both projections |
| 4 | **SC4 (BUIL-10):** user opens print preview from the builder and sees pagination/styling matching the PDF | ✓ VERIFIED | PrintPreviewDialog measure-and-slice (ref callback, keyed remeasure, zero useEffect — grep clean); dialog parity test green: page-block count == PDF numPages (edge-20), slices vs PDF < 0.08 with thead-strip + break-shift machinery (edge-23/21/22) |
| 5 | D-09 back-compat: Phase-2-era doc without template/branding/pageSize parses and renders — no Dexie migration | ✓ VERIFIED | Unit: "a Phase-2-era document without the new fields parses (no Dexie migration)" — safeParse on the legacy fixture; schema fields all optional; db.ts version untouched (git log) |
| 6 | D-14 pure resolver + D-13 `--tpl-*` CSS custom properties on #print-root, inherited by print | ✓ VERIFIED | resolveTokens.ts imports only ./tokens + ./types (no React/DOM/Dexie); toCssVars emits 18 canonical vars; DocumentPage spreads them as CSSProperties on #print-root (parity proves the seam: same vars drive screen and PDF) |
| 7 | D-10: template switch keeps the SAME branding object — set overrides survive, unset re-derives | ✓ VERIFIED | Unit: edge-08/09 (switch with unset → new defaults; with set → override survives); RenderBench selectTemplate never clears branding; parity goldens drift-free across the 7-template loop |
| 8 | BRND-04: Geist Mono + Source Serif 4 bundled unconditionally; font-deterministic capture | ✓ VERIFIED | package.json exact pins `5.3.0` (no ranges) for both; index.css has all 3 unconditional @fontsource imports; no fontsource import in any template file; `document.fonts.ready` awaited before every screenshot/PDF (edge-26) |
| 9 | Security V5: `?template=`/`?size=` whitelisted against registry/PAGE_SIZES; unknown → defaults, never error/reflection | ✓ VERIFIED | routes/index.tsx whitelist Sets + `has()` checks; harness exercises known keys (`?template=` × 7 in captureFixture, `?size=a5|a3`); unknown-key fallback code is simple and readable, runtime path → Human Verification |
| 10 | D-11: empty store seeds an English Minimal demo; bench renders it; `?fixture=` harness path unchanged | ✓ VERIFIED | seedDemoIfEmpty idempotent on DEMO_DOCUMENT_ID='demo-invoice' (unit: repos.test.ts "seeds exactly once"); fixture id matches; FIXTURE_KEYS whitelist preserved in routes; ?fixture= path byte-identical (parity green); demo visual → Human Verification |

**Score:** 9/10 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| src/document/types.ts | Optional template/pageSize/branding fields + re-exported types | ✓ VERIFIED | z.enum 7 ids / 3 sizes / partial branding (D-09); TemplateId/PageSize/Branding exported |
| src/document/tokens.ts | TemplateTokens/ResolvedTokens + PAGE_SIZES + PAGE_SIZE_PX + 7-entry TEMPLATE_REGISTRY | ✓ VERIFIED | 7 entries keyed identically to the z.enum union; font stacks; mm + px geometry |
| src/document/templates/*.ts ×7 | UI-SPEC-verbatim token literals | ✓ VERIFIED | All 7 files exist (46-50 lines each), data-only, registry-backed; pairwise-distinct unit-pinned |
| src/document/resolveTokens.ts | Pure resolveTokens + toCssVars | ✓ VERIFIED | No React/DOM/Dexie imports; D-02 partial merge; D-04 accent chain; 18 --tpl-* vars |
| src/document/__tests__/tokens.test.ts | Unit suite | ✓ VERIFIED | 14 tests; full suite 64/64 green (4 files) |
| src/components/DocumentPage.tsx | Prop-driven, template-agnostic, --tpl-* vars on #print-root | ✓ VERIFIED | No templateId branch; preset selection off resolved style; watermark three-way; pageStyleFor |
| src/components/RenderBench.tsx | Bench shell + 320px rail + gallery + branding + page-size select | ✓ VERIFIED | Fixture/demo paths; D-10 switch; D-01 persistence; print-neutral chrome |
| src/components/print/*.tsx ×6 | 3×3 preset matrix, {tokens, model}, no hardcoded hex/font | ✓ VERIFIED | Grep `#[0-9a-fA-F]` and `templateId` → 0 hits; logo-null guards in all 3 headers |
| src/components/TemplateGallery.tsx | 7 cards, 3 swatches each, selection ring + check | ✓ VERIFIED | Radiogroup, 2-col grid, token-derived swatches |
| src/components/BrandingPanel.tsx | Logo/colors/fonts/header/footer/watermark/reset | ✓ VERIFIED | T-03-02 read-time gate; no hardcoded colors (token presets); confirm dialogs |
| src/components/PrintPreviewDialog.tsx + ui/dialog.tsx | Measure-and-slice page stack, counter, Print/Close | ✓ VERIFIED | Ref-callback measurement (no useEffect); keyed remeasure; error boundary; print:hidden portal |
| src/styles/print.css | @page a5/a3 + .page-a5/.page-a3 + watermark + thead/break rules | ✓ VERIFIED | No var() inside any @page rule; A4 unnamed default; class↔page-name match |
| tests/parity.spec.ts | 6 tests: 7-template loop, A5/A3 structural, dialog parity, baseline | ✓ VERIFIED | All 6 green on committed goldens, no UPDATE_BASELINES; derived band targets (Pitfall 1) |
| tests/helpers/raster.ts | blendColor + existing raster helpers | ✓ VERIFIED | blendColor exported per RESEARCH.md:405-415; used by watermarkBlendFor |
| tests/fixtures/invoice-torture.{7}.preview.png | 7 committed goldens | ✓ VERIFIED | All exist (294-409 KB), width 794 asserted, nonWhite > 0.01 asserted, drift-free < 0.005 |
| src/document/fixtures.ts | English fixtures (D-05) + invoice-demo seed | ✓ VERIFIED | German-content grep over fixtures.ts + DocumentPage + presets → 0 matches; torture = 18 items; demo id 'demo-invoice' |
| src/db/repos.ts | seedDemoIfEmpty | ✓ VERIFIED | get/put keyed on DEMO_DOCUMENT_ID; idempotence unit-tested |
| src/routes/index.tsx | FIXTURE_KEYS + ?template=/?size= whitelists | ✓ VERIFIED | Set-based validation; safe degradation; T-01-01 pattern intact |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| resolveTokens/toCssVars | #print-root inline style (CSSProperties cast) | D-13 single seam | WIRED | The vars drive the stylesheet; print projection inherits from the same element — proven behaviorally by preview==print==PDF across 7 templates |
| TEMPLATE_REGISTRY keys | types.ts z.enum union + route whitelist | 3 consumers of one id list | WIRED | Set-equality unit-pinned (tokens.test.ts) |
| RenderBench template-switch | resolveTokens re-resolution | D-10 same branding object | WIRED | setCurrentTemplate + same model.branding; unit-pinned merge semantics; gallery UI wiring present |
| DocumentPage watermark | deriveWatermark(status) | BRND-06 auto path | WIRED | Three-way resolve delegates 'auto' to the single Phase-2 engine, never reimplemented (verified by code read) |
| pageSize → className page-{size} | @page named rules | Pitfall-2 coupling | WIRED | DocumentPage emits `page-a5`/`page-a3`; print.css `#print-root.page-a5 { page: a5 }` names match |
| PrintPreviewDialog blocks | harness cropY geometry | Same A4 raster constants | WIRED | PAGE_SIZE_PX derived from raster.ts A4_WIDTH/HEIGHT; dialog parity test asserts block count == numPages |
| BrandingPanel | model.branding + documentsRepo.put | D-01 persistence | WIRED | Panel patches the SAME object DocumentPage renders; demo path persists via put |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| DocumentPage | model (line items, totals) | FIXTURE_MAP / seeded demo | Yes — 18-item torture + 3-item demo fixtures flow through computeTotals → rendered rows | ✓ FLOWING |
| TemplateGallery swatches | resolved palette | TEMPLATE_REGISTRY token data | Yes — 7 distinct token sets | ✓ FLOWING |
| BrandingPanel | model.branding + company.logo | per-document state → documentsRepo.put | Yes — real user values; logo via readAsDataURL (data: URL only) | ✓ FLOWING |
| PrintPreviewDialog | measuredH / sliceCount | ref-callback offsetHeight | Yes — real layout measurement; sliceCount = max(1, ceil(totalH/pageH)) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Unit suite (registry, resolver, schema, seed) | `pnpm test:unit` | 4 files / 64 tests passed (1.56s) | ✓ PASS |
| Build (harness serves dist) | `pnpm build` | vite build + PWA generateSW clean | ✓ PASS |
| Preview == print == PDF, all 7 templates + bands + pagination | `pnpm exec playwright test tests/parity.spec.ts --timeout=180000 --workers=1` | 6 passed (1.2m): preview-vs-print, print-vs-PDF, bands, baseline drift-free, A5/A3 structural, dialog parity | ✓ PASS |
| No anti-patterns in phase files | grep TBD/FIXME/XXX, TODO/HACK/placeholder, dangerouslySetInnerHTML, useEffect in dialog, templateId branches, hex in presets | All zero matches | ✓ PASS |
| German-content scan | grep German terms in fixtures.ts + DocumentPage + presets | 0 matches | ✓ PASS |
| CI never re-baselines | grep UPDATE_BASELINES in .github/ | No match | ✓ PASS |

**Step 7b note:** The parity harness IS the behavioral test for the core behavior-dependent truths (screen==print==PDF identity, pagination, dialog==PDF). It ran green in this verification — SC1/SC3/SC4 are behaviorally verified, not presence-verified. SC2 (interactive branding flow) has no automated test → routed to human verification.

### Requirements Coverage

All 17 phase requirement IDs accounted for across the 5 plans — no orphans, no unclaimed IDs:

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| TEMP-01 | 01, 02 | Template set covers 7 named templates | ✓ SATISFIED | 7-entry registry = z.enum; unit-pinned set equality |
| TEMP-02 | 01, 02 | Templates control typography/colors/borders/spacing/layout | ✓ SATISFIED | 7 distinct token sets; pairwise-distinctness unit test |
| TEMP-03 | 01, 02, 03 | Applying a template never changes structure | ✓ SATISFIED | No templateId branches; preset wiring only replaces header/footer JSX; parity + human-approved goldens |
| BRND-01 | 04 | User can set a logo | ✓ SATISFIED | LogoControl (type+size gate, data: URL into company.logo, remove confirm) |
| BRND-02 | 04 | User can set primary color | ✓ SATISFIED | ColorControl + D-02 overlay |
| BRND-03 | 04 | User can set accent color | ✓ SATISFIED | ColorControl + D-02 overlay |
| BRND-04 | 02, 03, 04 | User can choose fonts | ✓ SATISFIED | Font selects (3 bundled fonts); exact 5.3.0 pins |
| BRND-05 | 03, 04 | User can configure header/footer style | ✓ SATISFIED | 3×3 preset matrix + selects |
| BRND-06 | 04 | User can apply Draft/Paid watermark | ✓ SATISFIED | Three-way resolve (edges 11/12/13; auto delegates to deriveWatermark) |
| BRND-07 | 01, 04 | PDF output always renders on a white page | ✓ SATISFIED | #ffffff background both projections; parity loop proves per template |
| PDF-01 | 01, 05 | PDF defaults to A4 | ✓ SATISFIED | Resolver/pageStyle 'a4' default; unit + harness |
| PDF-02 | 05 | User can select optional page sizes | ✓ SATISFIED | A5/A3 named @page + bench Select + structural test |
| PDF-03 | 05 | PDF paginates automatically | ✓ SATISFIED | thead repeat + break-inside:avoid; pagination ≥ 2 asserted |
| PDF-04 | 01 | PDF renders at high resolution | ✓ SATISFIED | Print-CSS vector path (page.pdf embeds vector text); rasterized at 794px for parity — vector source is resolution-independent |
| PDF-05 | 01, 05 | PDF respects print margins | ✓ SATISFIED | 15mm page-block padding, @page margin 0 (no double offset); harness-measured |
| PDF-06 | 01, 04 | PDF output identical to on-screen preview | ✓ SATISFIED | Parity harness 6/6 green, 7 templates, drift-free goldens |
| BUIL-10 | 05 | User can open print preview from the builder | ✓ SATISFIED | PrintPreviewDialog + dialog parity test |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | None found in phase files | — | All greps (debt markers, placeholder, hardcoded hex in presets, raw HTML, useEffect in dialog, templateId branches) returned zero matches |

### Human Verification Required

End-of-phase UAT items (the phase's own `<human-check>` blocks, consolidated; several were browser-smoked during execution but not committed as tests):

1. **Template gallery click-through** — click all 7 cards; each re-renders instantly with a distinct identity; content identical; structure never changes (03-03 Task 2 human-check).
2. **Branding WYSIWYG + persistence** — logo upload, instant recolor, font/header/footer switches, watermark Paid on draft → "PAID" overlay, reload persistence (D-01), 5 MB file rejection with inline error, remove-logo confirm (03-04 Task 1 human-check).
3. **Watermark override edges** — forced DRAFT on paid doc (edge-11), forced PAID on draft doc (edge-12); auto+paid → no watermark.
4. **Page sizes in browser** — A5 148mm canvas + Ctrl+P paper size; A3; A4 default on load (03-05 Task 1 human-check).
5. **Print preview dialog UX** — torture → 2 blocks with counter + repeated thead; simple → 1 block; Print opens browser dialog; Close works (03-05 Task 2 human-check).
6. **Empty-store demo** — empty IndexedDB → English Minimal demo renders; hard-refresh persists (seeded once); ?fixture= torture still works (03-01 Task 2 human-check).
7. **Unknown query-param degradation** — ?template=unknown / ?size=unknown render defaults, no error page (03-02 D7).

Items from earlier plans already human-approved (not re-listed): fontsource legitimacy gate (03-02 Task 1, APPROVED), 7-golden visual review (03-04 Task 3, APPROVED — TEMP-03 structural review for plan 01 subsumed here).

### Gaps Summary

No gaps found. All automated gates green: unit 64/64, parity 6/6 on committed goldens (no UPDATE_BASELINES), build clean, all anti-pattern greps clean. The phase goal — documents rendering identically on screen and in PDF via style-only templates and branding — is behaviorally proven by the parity harness (screen == print == PDF for all 7 templates, dialog == PDF pagination, A5/A3 geometry) and structurally proven by the token architecture (7 distinct UI-SPEC-verbatim token sets over one template-agnostic skeleton).

The status is `human_needed` (not `passed`) because the interactive WYSIWYG flows (branding controls, gallery switching, window.print() paper size, dialog UX, demo visual, unknown-param degradation) are wired and code-verified but not exercised by an automated test — the phase itself planned these as end-of-phase UAT items.

---

_Verified: 2026-08-09T11:15:00Z_
_Verifier: the agent (gsd-verifier)_
