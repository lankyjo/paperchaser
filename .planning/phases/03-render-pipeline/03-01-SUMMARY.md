---
phase: 03-render-pipeline
plan: 01
subsystem: ui
tags: [react, zod, css-variables, playwright, vitest, dexie, tanstack-router]

# Dependency graph
requires:
  - phase: 02-domain-core-persistence
    provides: documentSchema, computeTotals/deriveWatermark, Dexie repos
provides:
  - Optional template/pageSize/branding schema fields with render-time defaults (D-09, no migration)
  - Data-driven token registry (TEMPLATE_REGISTRY, Minimal entry) + pure resolver (D-12/D-14)
  - Prop-driven template-agnostic DocumentPage surfacing --tpl-* CSS vars on #print-root (D-13)
  - Template-parameterized golden parity harness + committed Minimal golden (D-06)
  - Empty-store demo seed (seedDemoIfEmpty) + render bench shell (D-11)
affects: [03-02 (full registry), 03-03 (branding controls), 03-04 (fonts/page sizes), 03-05 (print preview)]

actuals:
  tokens: 8859
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data-driven token registry: adding a template = adding a token file; renderer stays template-agnostic (D-12)"
    - "Pure resolver module in src/document/ with the totals.ts 'no React/DOM/Dexie' header contract (D-14)"
    - "Resolved tokens → --tpl-* CSS custom properties spread as inline style on #print-root (D-13)"
    - "Mount wrapper (useMountEffect) for one-time async seed/load — house rule, no raw useEffect"
    - "Tailwind print: variants make bench chrome print-neutral without touching print.css"

key-files:
  created:
    - src/document/tokens.ts
    - src/document/templates/minimal.ts
    - src/document/resolveTokens.ts
    - src/document/__tests__/tokens.test.ts
    - src/components/RenderBench.tsx
    - src/lib/useMountEffect.ts
    - tests/fixtures/invoice-torture.minimal.preview.png
  modified:
    - src/document/types.ts
    - src/components/DocumentPage.tsx
    - tests/parity.spec.ts
    - src/document/fixtures.ts
    - src/db/repos.ts
    - src/db/__tests__/repos.test.ts
    - src/routes/index.tsx

key-decisions:
  - "Resolver contract: resolveTokens(template, branding?) → ResolvedTokens + toCssVars() → the 13 canonical --tpl-* vars; missing template→'minimal' and pageSize→'a4' defaults live at the DocumentPage/resolver seam (D-08/D-09, PDF-01)"
  - "TEMPLATE_REGISTRY typed as Record<TemplateId, TemplateTokens> with a cast while the tracer ships Minimal only — the full-record type is the contract for plans 02/03; test pins Object.keys === ['minimal'] (TEMP-01 partial)"
  - "T-01-01 posture preserved: ?fixture= whitelist Set kept; unknown/absent fixture now falls through to the demo path (D-11) instead of DEFAULT_FIXTURE='invoice-simple' — resolves the plan's internal tension (preserve-default-fallback vs demo-on-empty) toward the D-11 acceptance criteria"
  - "D-04 single mechanism: .watermark color via inline style={{ color: resolved.accent }}; print.css #1d4ed8 kept only as stylesheet fallback"
  - "Bench chrome made print-neutral via Tailwind print: variants (header print:hidden, main print:pb-0) — measured parity break 0.068 > 0.05 without it; no print.css change (acceptance criterion)"

patterns-established:
  - "Template tokens → CSS custom properties → one DOM, three projections (parity by construction)"
  - "Idempotent seed via get/put keyed on a constant document id (StrictMode-safe)"
  - "German static labels + de-DE formatter stay pinned this plan (Open Question 1 RESOLVED: keep de-DE); D-05 English fixture translation lands in later plans"

requirements-completed: [TEMP-01, TEMP-02, TEMP-03, PDF-01, PDF-04, PDF-05, PDF-06, BRND-07]

coverage:
  - id: D1
    description: "Optional template/pageSize/branding schema fields (D-09) — Phase-2-era docs without them still safeParse; docs with them parse; TemplateId/PageSize/Branding re-exported"
    requirement: TEMP-03
    verification:
      - kind: unit
        ref: "src/document/__tests__/tokens.test.ts#documentSchema — D-09 back-compat"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pure token registry + Minimal template + resolver: resolveTokens D-02 partial merge, D-04 accent fallback '#1d4ed8', toCssVars 13 canonical --tpl-* vars, TEMP-01 partial registry, edge-13 deriveWatermark('sent') null"
    requirement: TEMP-01
    verification:
      - kind: unit
        ref: "src/document/__tests__/tokens.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "DocumentPage prop-driven {model, template?, branding?, pageSize?}; resolved --tpl-* vars on #print-root; watermark accent-colored; DOM skeleton unchanged (TEMP-03)"
    requirement: PDF-01
    verification:
      - kind: integration
        ref: "tests/parity.spec.ts (preview==print 0.01, print==PDF 0.05/0.06, bands, pagination)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Template-parameterized parity harness (captureFixture template param, fonts.ready, per-template golden path) + regenerated committed Minimal golden"
    requirement: PDF-06
    verification:
      - kind: integration
        ref: "tests/parity.spec.ts#baseline — width 794, nonWhite>0.01, diff<0.005"
        status: pass
    human_judgment: true
    rationale: "TEMP-03 visual review (plan <human-check>): the regenerated golden vs the old invoice-torture.preview.png must show ONLY style-level change (fonts/colors/spacing per Minimal tokens), never structural — automation proves parity but not 'same layout'"
  - id: D5
    description: "Empty-store demo seed (seedDemoIfEmpty idempotent on 'demo-invoice') + render bench shell rendering the English Minimal demo through DocumentPage; ?fixture= harness path unchanged"
    requirement: PDF-05
    verification:
      - kind: unit
        ref: "src/db/__tests__/repos.test.ts#seedDemoIfEmpty idempotence"
        status: pass
      - kind: manual_procedural
        ref: "browser smoke: empty store → Northwind Studio renders; hard refresh → persists (seeded once)"
        status: pass
    human_judgment: true
    rationale: "Visual adequacy of the bench canvas/demo (plan <human-check>: open app with empty IndexedDB store) needs human eyes; automation proves seed/render/persist mechanics only"

# Metrics
duration: 19min
completed: 2026-08-08
status: complete
---

# Phase 3 Plan 01: Minimal Template Tracer Slice Summary

**Optional schema fields → data-driven token registry → pure resolver → --tpl-* CSS custom properties on #print-root → parity-green golden, plus an empty-store demo seed and render bench shell proving the seam end-to-end**

## Performance

- **Duration:** 19 min
- **Started:** 2026-08-08T23:05:10Z
- **Completed:** 2026-08-08T23:23:56Z
- **Tasks:** 2 (Task 1 = RED+GREEN tracer, Task 2 = demo seed + bench)
- **Files modified:** 13 (7 created, 6 modified + 1 golden deleted)

## Accomplishments

- **D-09 schema extension:** `template` / `pageSize` / `branding` optional fields on `documentSchema` with re-exported `TemplateId` / `PageSize` / `Branding` types — a Phase-2-era stored document without the new keys parses (unit-pinned), no Dexie migration.
- **D-12/D-14 token engine:** `tokens.ts` (TemplateTokens/ResolvedTokens types, FONT_STACKS, PAGE_SIZES, TEMPLATE_REGISTRY seam), `templates/minimal.ts` (UI-SPEC Minimal identity verbatim), and `resolveTokens.ts` (pure — no React/DOM/Dexie imports) implementing the D-02 partial-merge, the D-04 accent chain (`accentColor ?? palette.accent ?? palette.primary ?? '#1d4ed8'`), and `toCssVars` emitting the 13 canonical `--tpl-*` custom properties.
- **D-13 renderer:** `DocumentPage` is prop-driven `{model, template?, branding?, pageSize?}` and template-agnostic (no templateId branch); resolved vars spread as CSSProperties on `#print-root`; watermark accent via inline style (single mechanism); DOM skeleton unchanged (TEMP-03); de-DE formatter kept (Open Question 1 RESOLVED: pinned).
- **D-06 harness:** `captureFixture(page, template)` + `document.fonts.ready` (Pitfall 4) + per-template golden path `invoice-torture.{template}.preview.png`; baseline test loops templates; all calibration constants untouched; superseded German golden removed.
- **D-11 bench:** `seedDemoIfEmpty()` (get/put idempotent on `DEMO_DOCUMENT_ID`) + `RenderBench` shell (Paperchaser header, gray canvas, soft-shadow page block) + rewritten route preserving the `FIXTURE_KEYS` whitelist; browser smoke proved empty-store demo render + persistence across hard refresh.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): token resolver tests for the Minimal slice** - `a6b579a` (test)
2. **Task 1 (GREEN): Minimal template end-to-end slice** - `14a8fd9` (feat)
3. **Task 2: demo seed + render bench shell** - `6149a42` (feat)

## Files Created/Modified

- `src/document/types.ts` - Optional `template`/`pageSize`/`branding` fields + re-exported `TemplateId`/`PageSize`/`Branding` (D-09)
- `src/document/tokens.ts` - Token registry types, `FONT_STACKS`, `PAGE_SIZES`, `TEMPLATE_REGISTRY` seam (D-12)
- `src/document/templates/minimal.ts` - Minimal token literal, UI-SPEC values verbatim
- `src/document/resolveTokens.ts` - Pure `resolveTokens`/`toCssVars` (D-14/D-13)
- `src/document/__tests__/tokens.test.ts` - 8 resolver/registry/schema unit tests (RED gate)
- `src/components/DocumentPage.tsx` - Prop-driven refactor; `--tpl-*` vars on `#print-root`
- `tests/parity.spec.ts` - Template-parameterized capture + per-template golden baseline loop
- `tests/fixtures/invoice-torture.minimal.preview.png` - Committed Minimal golden (794×1805), old `invoice-torture.preview.png` removed
- `src/document/fixtures.ts` - `'invoice-demo'` fixture (model.id `'demo-invoice'`, English, 3 items, logo null)
- `src/db/repos.ts` - `DEMO_DOCUMENT_ID` + `seedDemoIfEmpty()`
- `src/db/__tests__/repos.test.ts` - Seed idempotence/no-overwrite tests
- `src/components/RenderBench.tsx` - Bench shell (fixture path + demo path)
- `src/lib/useMountEffect.ts` - House-rule mount wrapper
- `src/routes/index.tsx` - Renders RenderBench; `FIXTURE_KEYS` whitelist preserved

## Decisions Made

- **Resolver seam:** `resolveTokens(template, branding?)` + `toCssVars(resolved)` in one pure module; the missing-field defaults (`template→minimal`, `pageSize→a4`) resolve at the DocumentPage/resolver seam, so back-compat (D-09) lives in one place.
- **Registry partial-state typing:** `TEMPLATE_REGISTRY` keeps the full `Record<TemplateId, TemplateTokens>` type via a cast while the tracer ships Minimal only — the test pins `Object.keys === ['minimal']`; plans 02/03 fill the remaining six entries.
- **T-01-01 vs D-11 resolution:** the plan internally tensions "preserve the DEFAULT_FIXTURE fallback exactly" against "empty store shows the demo". Resolved toward D-11 (its acceptance + human-check are explicit): the whitelist Set survives, but unknown/absent `?fixture=` now falls through to the seeded demo instead of `invoice-simple`. Harness behavior is byte-identical (it always passes a whitelisted key).
- **Print-neutral chrome without print.css:** the bench header in print flow pushed `#print-root` down 48px, breaking print-vs-PDF page 1 (measured 0.068 > 0.05). Fixed with Tailwind `print:` variants (`print:hidden`, `print:pb-0`, `print:min-h-0`) — no `src/styles/print.css` change (acceptance criterion held).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Bench chrome shifted the printed page, breaking print-vs-PDF parity**
- **Found during:** Task 2 (parity harness after route rewrite to RenderBench)
- **Issue:** The bench header (48px) + canvas padding sit in normal flow inside `.app-shell`; print.css neutralizes only the shell, so in print the hidden-but-layout-active chrome pushed `#print-root` down the printed page. `page.pdf()` paginates the full page, so the print-projection slice (element box, unshifted) no longer aligned with PDF page 1 — fraction 0.068 vs the 0.05 ceiling.
- **Fix:** Made the bench chrome print-neutral with Tailwind `print:` variants (header `print:hidden`, main `print:pb-0`, flex-col `print:min-h-0`) — removes the chrome from the printed flow entirely. No `src/styles/print.css` change, satisfying the plan's "no print.css change" acceptance criterion.
- **Files modified:** src/components/RenderBench.tsx
- **Verification:** `pnpm test` — all 4 parity tests green (print-vs-PDF back under 0.05)
- **Committed in:** 6149a42 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix was necessary for the core parity contract to hold through the bench shell. No scope creep — the fix is component-level styling, not a print.css change.

## TDD Gate Compliance

- RED `a6b579a` (test) precedes GREEN `14a8fd9` (feat) — sequence valid.
- RED failure mode is module-resolution (the test imports the not-yet-built `./tokens` / `./resolveTokens`), which the tdd-review gate prefers to avoid; the RED suite additionally contains two regression pins of EXISTING behavior that pass by construction (schema back-compat safeParse, `deriveWatermark('sent')` null) — these are back-compat pins, not new-feature tests, so they are green-by-design in RED. The GREEN commit fills the modules and all 8 tests pass.

## Issues Encountered

- **Print-vs-PDF parity break after route rewrite** — root-caused to the in-flow bench header; fixed via Tailwind `print:` variants (documented above as deviation 1).
- **`Record<TemplateId, TemplateTokens>` type error at GREEN** — the full-record type demands all 7 templates; resolved with the documented cast (registry contract retained for plans 02/03).

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| src/document/templates/minimal.ts | header.titleLabel 'INVOICE' | Declared token not yet rendered | Header/footer presets wire it in plan 03 (BRND-05); German static labels + D-05 English fixture translation land in later phase-3 plans |
| src/document/templates/minimal.ts | table.headerText, totals.rule | Contract fields carried, not yet consumed by renderer | Later plans wire the table-header color / grand-total rule into the renderer; values are UI-SPEC verbatim |
| src/components/DocumentPage.tsx | h2 'Rechnung' + German labels | Static German labels on English content | D-05 fixture/label translation is a later phase-3 plan; de-DE formatter pinned this plan (Open Question 1) |

None of these block the plan's goal — the Minimal document renders fully through the token pipeline; each stub is a declared contract surface for the next plans.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The proven seam (schema → registry → resolver → CSS vars → DocumentPage → parity) is green end-to-end with a committed golden — the architectural dead-end risk (token shape, resolver contract, CSS-var mechanism) is retired.
- Ready for 03-02: full 7-template registry + `?template=` whitelist + template gallery.
- Open items carried: TEMP-03 visual review of the regenerated golden (plan `<human-check>`), Safari 18.2+ ADR 0002 acceptance (pre-existing, does not block).

---
*Phase: 03-render-pipeline*
*Completed: 2026-08-08*
