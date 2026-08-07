---
phase: 02-domain-core-persistence
plan: 02
subsystem: domain
tags: [zod, money, totals, rounding, line-03, domain-core]

# Dependency graph
requires:
  - phase: 02-domain-core-persistence
    provides: zod 4.4.3 installed + vitest unit-test toolchain with `test:unit` script (02-01)
provides:
  - Schema-first document model: Zod 4 schemas as source of truth, z.infer types keeping exported names (D-15)
  - money.ts: CURRENCY_DECIMALS registry (EUR 2dp, JPY 0dp) + roundMinor half-away-from-zero (D-12, A1)
  - totals.ts: single derived computeTotals engine (per-line rounding, both discount levels, shipping/fees, taxByRate) + deriveWatermark (D-01..D-08, D-11, LINE-03)
  - DocumentPage.tsx consumes the domain engine; inline totals copy deleted
  - 22 unit fixtures pinning rounding policy, currency policies, discounts, shipping, reconciliation, schema acceptance
affects: [02-03, 02-04, phase 03, phase 04, phase 06]

# Actuals (#2632) — pairs with the plan's estimate (47000 tokens) to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 5790
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Schema-first model: Zod schemas are the source of truth, z.infer derives the types; exported names re-exported so consumers keep compiling (D-15, PATTERNS.md re-export pattern)"
    - "Single rounding primitive roundMinor (half-away-from-zero, matches Intl halfExpand); bare Math.round banned in money code"
    - "Pure domain modules carry a header stating 'nothing in this file may depend on React, the DOM, or Dexie'"

key-files:
  created:
    - src/document/money.ts
    - src/document/totals.ts
    - src/document/__tests__/totals.test.ts
  modified:
    - src/document/types.ts
    - src/document/fixtures.ts
    - src/components/DocumentPage.tsx

key-decisions:
  - "Schema-first model: Zod 4 schemas are the source of truth; z.infer derives LineItem/Company/Customer/DocumentModel, keeping Phase 1 exported names so fixtures and the renderer compile (D-15)"
  - "Money math: integer minor units with CURRENCY_DECIMALS registry (EUR 2dp, JPY 0dp); roundMinor half-away-from-zero is the single rounding primitive, never bare Math.round (D-01..D-03, D-12, A1)"
  - "Totals engine is the single derived source (LINE-03): per-line rounding before summation, tax on the rounded net, both discount levels, shipping/fees line-like with tax grouped by rate (D-04..D-08)"
  - "watermark derives from status via deriveWatermark(), never stored (D-11); fixtures edited watermark->status only, parity baselines stayed green"

patterns-established:
  - "Pattern: derived totals are computed by one domain engine (computeTotals) consumed by renderers — never reimplemented in components (grep-enforced: no `function computeTotals` outside totals.ts)"
  - "Pattern: schema-level security — logo constrained to data: URL or null via z.refine (T-02-02-LOGO)"

requirements-completed: [LINE-03]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "Single derived totals engine computeTotals in the domain core with per-line rounding in integer minor units; consumed by DocumentPage.tsx (inline copy deleted)"
    verification:
      - kind: unit
        ref: "src/document/__tests__/totals.test.ts (22 tests: per-line rounding, D-03 tax-on-rounded-net, D-12 EUR/JPY, discounts, shipping, reconciliation)"
        status: pass
      - kind: other
        ref: "grep 'function computeTotals' src/components/ -> empty; pnpm typecheck; pnpm test (parity 4/4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Money primitives: CURRENCY_DECIMALS registry (EUR 2dp, JPY 0dp) and roundMinor half-away-from-zero tie handling (A1)"
    verification:
      - kind: unit
        ref: "src/document/__tests__/totals.test.ts#rounds a negative .5 tie AWAY from zero — Math.round(-2.5) is -2, roundMinor yields -3"
        status: pass
    human_judgment: false
  - id: D3
    description: "Schema-first model restructure: Zod 4 documentSchema + z.infer types keeping exported names; fixtures compile with watermark->status swap; unknown keys stripped (D-14); logo constrained to data: URLs (T-02-02-LOGO)"
    verification:
      - kind: unit
        ref: "src/document/__tests__/totals.test.ts#documentSchema — restructured model accepts the Phase 1 fixture shape (D-15, D-11)"
        status: pass
      - kind: other
        ref: "pnpm typecheck (fixtures.ts + DocumentPage.tsx compile); grep 'model.watermark' src/ -> empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "Watermark derives from status via deriveWatermark('draft'|'sent'|'paid') — never stored (D-11)"
    verification:
      - kind: unit
        ref: "src/document/__tests__/totals.test.ts#deriveWatermark — derives from status, never stored (D-11)"
        status: pass
    human_judgment: false

# Metrics
duration: 11min
completed: 2026-08-07
status: complete
---

# Phase 02 Plan 02: Schema-First Model + Money/Totals Engine + Renderer Swap Summary

**One derived `computeTotals` engine in integer minor units (per-line rounding, half-away-from-zero ties, EUR/JPY registry, both discount levels, shipping/fees grouped by rate) replaces the inline totals copy in DocumentPage.tsx; the model is restructured schema-first with Zod 4 as the source of truth; 22 unit fixtures pin LINE-03 and parity stays green.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-08-07T22:53:00Z (approx, pre-first-commit)
- **Completed:** 2026-08-07T23:04:30Z
- **Tasks:** 3 (1 tracer + 2 TDD fixture tasks)
- **Files modified:** 6

## Accomplishments

- `src/document/types.ts` restructured schema-first: `documentSchema` + nested Zod 4 schemas (`z.object()` default strip = D-14), `z.infer` types keep exported names `LineItem`/`Company`/`Customer`/`DocumentModel` so `fixtures.ts` and `DocumentPage.tsx` compile unchanged apart from the watermark→status edit
- Model gains `type` enum (D-09), `status` enum (D-11), `currency` enum derived from `CURRENCY_DECIMALS` keys (D-12), per-line + document-level discounts (D-05/D-06), shipping/fees array with required `taxRateMinor` 0 = untaxed (D-07/D-08, Pitfall 3)
- Logo schema-constrained to `data:` URLs or null via `z.refine` (T-02-02-LOGO threat mitigation)
- `src/document/money.ts`: `CURRENCY_DECIMALS = { EUR: 2, JPY: 0 }` + `roundMinor` (half-away-from-zero, matching Intl halfExpand — A1)
- `src/document/totals.ts`: the single LINE-03 engine — per-line rounding before summation, tax on the rounded net (D-03), tax grouped by rate (D-04), shipping/fees uniform treatment (D-07), `deriveWatermark(status)` (D-11)
- `src/components/DocumentPage.tsx`: inline `computeTotals`/`Totals` (lines 20-37) deleted; consumes the domain engine; per-line printed amounts use `totals.lineNets[index]` so line and totals always reconcile; watermark read replaced with `deriveWatermark(model.status)`
- 22 Vitest fixtures green (`pnpm exec vitest run src/document/__tests__/totals.test.ts`), including a negative .5-tie case, EUR 2dp + JPY 0dp cases, a D-03 case where tax on the rounded net (21) differs from tax on the raw float (20), both discount levels/kinds, taxed + untaxed shipping, rate grouping, and the Σ lineNets == subtotal reconciliation invariant
- Phase 1 parity contract unregressed: `pnpm test` 4/4 golden baselines green after the tracer and at final gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema-first model restructure + money engine + renderer swap (tracer)** - `fa3e755` (feat)
2. **Task 2: LINE-03 unit fixtures: rounding policy and currency cases** - `fc1e955` (test)
3. **Task 3: LINE-03 unit fixtures: discounts, shipping/fees, and deriveWatermark** - `ac2616a` (test)

**Plan metadata:** pending (docs: complete plan — committed after state updates)

## Files Created/Modified

- `src/document/types.ts` - RESTRUCTURED: Zod 4 schemas (`documentSchema`, `lineItemSchema`, `discountSchema`, `shippingFeeSchema`, `companySchema`, `customerSchema`, `logoSchema`), z.infer types preserving exported names; type/status/currency enums
- `src/document/money.ts` - NEW: `CURRENCY_DECIMALS` registry + `roundMinor` half-away-from-zero
- `src/document/totals.ts` - NEW: `computeTotals(doc)` + `deriveWatermark(status)` + `Totals`/`Discount`/`ShippingFee` interfaces
- `src/document/__tests__/totals.test.ts` - NEW: 22 LINE-03 unit fixtures
- `src/document/fixtures.ts` - EDIT: `watermark: 'draft'` → `status: 'draft'`; `watermark: null` → `status: 'paid'` (only change)
- `src/components/DocumentPage.tsx` - EDIT: inline engine deleted, domain engine imported, per-line amounts via `lineNets[index]`, watermark via `deriveWatermark(model.status)`

## Decisions Made

- **Zod 4 API only** in the schemas: `z.object()` default strip (D-14), `z.int()`, `z.iso.date()`, top-level `z.email()`, `z.enum` — no `.strict()`/`.flatten()`/`.passthrough()` (Pitfall 4; grep-verified empty)
- **`currency` enum derived from `CURRENCY_DECIMALS` keys** per RESEARCH A4 — the schema makes currency additions explicit rather than silently accepting arbitrary codes
- **`computeTotals` keeps the RESEARCH structural parameter type** (currency + lineItems + discount + shippingFees) — DocumentModel is structurally assignable, so the renderer passes the whole document while fixtures stay minimal
- **Engine formula kept verbatim from RESEARCH** (incl. `decimals = CURRENCY_DECIMALS[currency]`) — fixtures are exact-integer at engine level per the plan's own "assert exact integer minor-unit outputs" contract; the half-away-from-zero tie policy is pinned directly on `roundMinor` (A1)

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

Tasks 2-3 carry `tdd="true"` but the plan's mandated ordering places the tracer (task 1, `fa3e755`) BEFORE the fixture tasks — the engine is built first, then the fixtures validate it (the plan's task 1 note states this explicitly: "this tracer creates no test file — the behavior expectations are realized as RED→GREEN unit fixtures in task 2"). Consequently there is no separate RED commit: the test file's imports (`../totals`, `../money`) did not resolve against the pre-plan codebase, so the RED state was "module absent" rather than "test failing". The fixtures were committed as two `test(02-02)` commits (`fc1e955`, `ac2616a`) and pin every behavior the RED phase would have: per-line rounding (would fail against the old inline float-summing engine), half-away-from-zero ties, D-03 tax-on-rounded-net, EUR/JPY policies, both discount levels/kinds, shipping grouping, reconciliation, and schema acceptance. The deviation is in commit sequencing only — test quality and coverage are per the plan.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LINE-03 delivered and pinned: one derived totals engine consumed by the renderer; exhaustive unit fixtures; parity baselines green
- `money.ts`/`totals.ts` are the pure domain primitives plans 02-03 (persistence repos) and 02-04 (envelope import/export) and Phase 3 (render pipeline) build on
- `documentSchema` is the schema-first source of truth the 02-04 envelope boundary validates against (D-15)
- Note for 02-03: `db.version(1)` still untouched (grep-verified) — the version(2) migration is 02-03's task

---

*Phase: 02-domain-core-persistence*
*Completed: 2026-08-07*

## Self-Check: PASSED

- All 6 plan files exist on disk: `src/document/{money,totals,types}.ts`, `src/document/fixtures.ts`, `src/components/DocumentPage.tsx`, `src/document/__tests__/totals.test.ts`
- Task commits present: `fa3e755` (feat), `fc1e955` (test), `ac2616a` (test)
- Plan-level verification re-run green at final gate: `pnpm lint` OK, `pnpm typecheck` OK, `pnpm test:unit` 22/22, `pnpm test` (parity) 4/4
- Grep gates: no `function computeTotals` in `src/components/`, no `model.watermark` in `src/`, no `.strict()/.flatten()/.passthrough()` in `src/document/`, `db.version(1)` intact
