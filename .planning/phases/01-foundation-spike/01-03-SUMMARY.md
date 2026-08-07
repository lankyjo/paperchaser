---
phase: 01-foundation-spike
plan: 03
subsystem: infra
tags: [adr, github-actions, ci, vite, tanstack-router, playwright, pnpm]

# Dependency graph
requires:
  - phase: 01-foundation-spike (01-01)
    provides: scaffold with lint/typecheck/build scripts + dist/ static build
  - phase: 01-foundation-spike (01-02)
    provides: pnpm test parity suite script, playwright.config.ts, committed golden baseline, UPDATE_BASELINES write path
provides:
  - ADR 0001 recording the framework decision (Vite 8 SPA + TanStack Router 1.170.22 over TanStack Start) with deciding evidence and the re-adoption trigger (ROADMAP SC1)
  - CI baseline workflow (.github/workflows/ci.yml): lint + typecheck + build + parity on every push/PR, frozen lockfile, Chromium install, diff-artifact upload on failure, baseline-write path structurally absent (ROADMAP SC4)
affects: [phase 02 persistence (framework is fixed: SPA, no SSR), phase 03 render pipeline (routing-mechanics freedom, static dist/ deploy), all later phases (CI green gate is automatic)]

# Actuals (#2632) — pairs with the plan estimate (26000 tokens @ low confidence).
# Scale: chars/4 over the realized committed diff (6820 chars across 2 commits).
actuals:
  tokens: 1705     # chars/4 over realized diff (plan over-estimated ~15x — ADR + workflow are single-file writes)
  tasks: 2         # tasks completed
  commits: 2       # commits made

# Tech tracking
tech-stack:
  added: [GitHub Actions (checkout@v4, pnpm/action-setup@v4, setup-node@v4, upload-artifact@v4)]
  patterns:
    - "CI mirrors local scripts verbatim: pnpm lint / typecheck / build / test — CI proves the same gates the developer runs"
    - "Golden baselines committed-only: the parity suite's write path (pnpm test:update) is structurally absent from CI"

key-files:
  created: [docs/adr/0001-framework.md, .github/workflows/ci.yml]
  modified: []

key-decisions:
  - "Vite 8 SPA + TanStack Router 1.170.22 is the application framework; TanStack Start rejected (RC + Node >= 22.12 server runtime + zero in-scope server features); re-adopted only if the product gains auth/sync/shared documents (ADR 0001)"
  - "CI baseline: single build-and-parity job, frozen lockfile, pinned major action versions, no baseline-writing step"

patterns-established:
  - "ADR evidence is research-sourced primary facts (Start RC quote, Router-alone guidance) — no runtime evidence needed for a framework decision with no server features in scope"
  - "CI gate sequence is byte-identical to the local gate sequence (VALIDATION.md full suite command)"

requirements-completed: ["spike (ROADMAP Phase 1 SC1: ADR records framework decision with deciding evidence; SC4: green CI baseline)"]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "ADR 0001 — framework decision (Vite 8 SPA + TanStack Router 1.170.22 vs TanStack Start) with the Start RC-status quote, Router-alone guidance, no-server-features rationale, alternatives considered, and the explicit re-adoption trigger"
    verification:
      - kind: other
        ref: "grep checks — 'Decision:' count 1; 'TanStack Start' count 10; RC quote present; Router-alone guidance present; react-router-dom alternative present"
        status: pass
    human_judgment: false
  - id: D2
    description: "CI baseline workflow — push/PR gate running install (frozen-lockfile) -> lint -> typecheck -> build -> Chromium install -> parity suite in order, uploading tests/artifacts/ on failure, with no baseline-writing step"
    verification:
      - kind: other
        ref: "grep checks — frozen-lockfile count 1; 'pnpm test' wired; UPDATE_BASELINES absent (grep -q fails); upload-artifact count 1; gate order install->lint->typecheck->build->test; YAML parsed via python yaml.safe_load"
        status: pass
      - kind: integration
        ref: "Full CI sequence run locally: pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test — 4/4 parity tests pass (29.6s)"
        status: pass
    human_judgment: false

# Metrics
duration: 9min
completed: 2026-08-07
status: complete
---

# Phase 1 Plan 3: ADR 0001 Framework Decision + CI Baseline Summary

**ADR 0001 records Vite 8 SPA + TanStack Router 1.170.22 as the application framework — rejecting TanStack Start on its own RC-status quote and Router-alone guidance, with the re-adoption trigger (auth/sync/shared documents) — and the CI baseline workflow wires lint + typecheck + build + the parity suite into a frozen-lockfile push/PR gate that never writes golden baselines, proving the exact CI command sequence green locally (4/4 parity tests).**

## Performance

- **Duration:** 9 min
- **Started:** 2026-08-07T17:40:04Z
- **Completed:** 2026-08-07T17:49:00Z
- **Tasks:** 2
- **Files modified:** 2 (docs/adr/0001-framework.md, .github/workflows/ci.yml)

## Accomplishments

- **ROADMAP SC1 closed:** `docs/adr/0001-framework.md` records the framework decision with deciding evidence — TanStack Start's own overview quote ("considered feature-complete and its API is considered stable. This does not mean it is bug-free or without issues"), its own Router-alone guidance for apps with no server features, the Node >= 22.12 server-runtime cost for zero in-scope features, Router 1.170.22's verified React 19 peer, and the alternatives (Start, react-router-dom 7.18.2) — plus the explicit re-adoption trigger: Start returns only if the product gains server features (auth, sync, shared documents). This resolves the PRD's TanStack Start pin as validated and overturned by the spike, exactly as the PRD's own "Validate stack in Phase 1 spike" mandate required.
- **ROADMAP SC4 closed:** `.github/workflows/ci.yml` runs the five gates in order — `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm exec playwright install --with-deps chromium`, `pnpm test` — on every push/PR, with pinned major action versions (checkout@v4, pnpm/action-setup@v4, setup-node@v4 with node-24 + pnpm cache, upload-artifact@v4) and `tests/artifacts/` uploaded as `parity-diffs` (7-day retention) on failure. The workflow's commands match package.json scripts byte-for-byte, so CI proves the same gates the developer runs locally.
- **Baseline discipline enforced (Pitfall 5):** the parity suite's write path (`pnpm test:update`) is structurally absent from CI — the workflow never sets the baseline-writing flag, so CI can never silently rewrite a committed golden.
- **Phase gate proven:** the exact CI sequence (`pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test`) ran green locally — 0 lint errors (1 pre-existing shadcn warning, out of scope), clean typecheck, clean build, 4/4 parity tests (29.6s). The CI step list is verified to be the green gate it claims to be.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write ADR 0001 — framework decision (Vite SPA + TanStack Router vs TanStack Start)** - `e944494` (docs)
2. **Task 2: Create the CI baseline workflow (lint + typecheck + build + parity + artifact upload)** - `f53c29d` (chore)

**Plan metadata:** (final metadata commit after this SUMMARY)

## Files Created/Modified

- `docs/adr/0001-framework.md` - Status/Context/Decision/Evidence/Consequences ADR; decision line verbatim from the plan; Start RC quote + Router-alone guidance + no-server-features scope table + alternatives table + re-adoption trigger
- `.github/workflows/ci.yml` - `build-and-parity` job on ubuntu-latest; gates in order install → lint → typecheck → build → playwright install → test; `if: failure()` artifact upload; no baseline-write step

## Decisions Made

- **Vite 8 SPA + TanStack Router 1.170.22 is the framework; Start rejected with a re-adoption trigger** — recorded in ADR 0001 from research-sourced primary evidence (Start's own docs recommend Router alone for no-server apps; Start is RC; no server features in scope). Overrides the PRD's Start pin under the PRD's own validation mandate.
- **CI = single job, frozen lockfile, pinned major actions, no baseline writing** — mirrors the research Code Examples exactly; the workflow's commands are byte-identical to package.json scripts so CI and local gates cannot diverge.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **A doc comment in ci.yml tripped the acceptance-criteria grep gate.** My first draft of the workflow carried a header comment naming the `UPDATE_BASELINES` flag ("this workflow never sets UPDATE_BASELINES…"); the plan's acceptance criterion is literally `! grep -q "UPDATE_BASELINES"`, and the comment itself matched. Reworded the comment to describe the write path without the literal flag name — gate passes (`grep -q` exits non-zero). No code change, no committed artifact affected.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required. The workflow activates automatically once the repo is pushed to GitHub (the workflow file is the only required artifact).

## Next Phase Readiness

- **Phase 01 foundation spike complete (3/3 plans):** framework decision (ADR 0001), PDF path decision (ADR 0002, Safari 18.2+ manual acceptance PENDING), parity harness + committed baseline, scaffold, and green CI baseline all in place.
- **Phase 2 (domain core & persistence) can start:** framework is fixed (Vite SPA + TanStack Router — no SSR, no server runtime); the CI green gate is automatic from the first push.
- **Open item carried forward:** ADR 0002's Safari 18.2+ paged-media manual acceptance step remains PENDING (from plan 01-02) — the only open item between the spike and the print-CSS decision being fully closed; it does not block Phase 2.

---
*Phase: 01-foundation-spike*
*Completed: 2026-08-07*

## Self-Check: PASSED

- All 2 key files exist on disk (`docs/adr/0001-framework.md`, `.github/workflows/ci.yml`)
- All 2 plan commits present: e944494 (ADR 0001), f53c29d (CI workflow)
- Plan-level verification green: `pnpm lint && pnpm typecheck && pnpm build` — 0 errors; full phase-gate sequence `+ pnpm exec playwright test` — 4/4 pass
