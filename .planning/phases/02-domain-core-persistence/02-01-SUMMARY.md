---
phase: 02-domain-core-persistence
plan: 01
subsystem: testing
tags: [zod, vitest, fake-indexeddb, pnpm, ci, unit-testing]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Vite 8 SPA, Playwright parity harness, tsconfig, package.json scripts
provides:
  - zod 4.4.3 / vitest 4.1.10 / fake-indexeddb 6.2.5 installed at exact pins (lockfile committed)
  - "test:unit" script (vitest run) + Vitest config scoped to src/**/*.test.ts
  - CI unit-test gate between typecheck and build
affects: [02-02, 02-03, 02-04, phase 03, phase 04, phase 06]

# Actuals (#2632) — pairs with the plan's estimate (14000 tokens) to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 5253
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: [zod 4.4.3, vitest 4.1.10, fake-indexeddb 6.2.5]
  patterns:
    - "Colocated Vitest units under src/**/__tests__/*.test.ts, explicit imports (globals off), default node environment"
    - "Vitest config lives in the existing vite.config.ts (defineConfig from vitest/config) — no separate vitest.config.ts"

key-files:
  created: []
  modified:
    - package.json
    - pnpm-lock.yaml
    - vite.config.ts
    - .github/workflows/ci.yml

key-decisions:
  - "Scoped vitest include to src/**/*.test.ts because vitest's default **/*.spec.ts glob collides with the Phase 1 Playwright spec (tests/parity.spec.ts) and fails the run"
  - "Set passWithNoTests: true so `pnpm exec vitest run` exits 0 with zero test files (Vitest 4 exits 1 otherwise) — required by the plan's own acceptance criterion"
  - "No vitest.config.ts created; config extends the existing vite.config.ts per the plan's zero-config prohibition"

patterns-established:
  - "Pattern: domain/persistence code ships with colocated Vitest unit tests consumed by CI's test:unit gate"

requirements-completed: [LINE-03, STOR-01, STOR-02, STOR-03, STOR-04]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "Unit-test toolchain installed at exact pins (zod 4.4.3, vitest 4.1.10, fake-indexeddb 6.2.5) with a test:unit script that runs vitest green on an empty suite"
    verification:
      - kind: other
        ref: "pnpm list zod vitest fake-indexeddb (shows zod@4.4.3 deps / vitest@4.1.10 + fake-indexeddb@6.2.5 devDeps); pnpm exec vitest run (exit 0); pnpm lint (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CI gates the unit suite via pnpm test:unit between pnpm typecheck and pnpm build; header comment documents the gate order"
    verification:
      - kind: other
        ref: "grep -n 'pnpm test:unit' .github/workflows/ci.yml (line 20, between typecheck 19 and build 21)"
        status: pass
    human_judgment: false
  - id: D3
    description: "zod package-legitimacy gate human-approved before install (zod was flagged [SUS] by the audit's recency heuristic — recorded false positive)"
    verification: []
    human_judgment: true
    rationale: "Blocking-human supply-chain gate — protocol requires a human to confirm npmjs.com/package/zod before install; cannot be automated or auto-approved."

# Metrics
duration: 18min
completed: 2026-08-07
status: complete
---

# Phase 02 Plan 01: Unit-Test Toolchain & CI Gate Summary

**Zod 4.4.3, Vitest 4.1.10, and fake-indexeddb 6.2.5 installed at exact pins with a `test:unit` script and a CI gate between typecheck and build — the verification infrastructure plans 02-04 all consume.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-08-07T21:23:41Z
- **Completed:** 2026-08-07T21:41:10Z
- **Tasks:** 3 (1 checkpoint human-approved + 2 auto)
- **Files modified:** 4

## Accomplishments

- zod 4.4.3 (dependencies) + vitest 4.1.10 / fake-indexeddb 6.2.5 (devDependencies) installed at exact pins; pnpm-lock.yaml committed (259 added lines)
- `"test:unit": "vitest run"` script added; Phase 1 parity `test`/`test:update` scripts byte-identical
- Vitest configured in the existing `vite.config.ts` (no new config file): include scoped to `src/**/*.test.ts`, `passWithNoTests: true`
- CI workflow gates `pnpm test:unit` in documented order: install -> lint -> typecheck -> unit tests -> build -> parity test
- zod legitimacy gate human-approved ("4.4.3; yes; approved") before any install
- Plan-level verification all green: exact pins, vitest exit 0, lint clean, typecheck clean, Phase 1 parity suite 4/4 passed

## Task Commits

Each task was committed atomically:

1. **Task 1: Pre-install legitimacy gate (zod 4.4.3)** - `checkpoint:human-verify` (blocking-human) — **HUMAN APPROVED** (no commit; gate task)
2. **Task 2: Install zod, vitest, fake-indexeddb; add test:unit script** - `b894438` (feat)
3. **Task 3: Gate CI on the unit suite** - `5ec2a22` (ci)

**Plan metadata:** `pending` (docs: complete plan — committed after state updates)

## Files Created/Modified

- `package.json` - `test:unit` script; zod in dependencies; vitest + fake-indexeddb in devDependencies (exact pins)
- `pnpm-lock.yaml` - lockfile entries for the three new packages
- `vite.config.ts` - Vitest test block (include glob + passWithNoTests); defineConfig imported from `vitest/config`
- `.github/workflows/ci.yml` - `pnpm test:unit` step between typecheck and build; updated gate-order comment

## Decisions Made

- **Vitest include scoped to `src/**/*.test.ts`** — vitest's default `**/*.spec.ts` glob matches the Phase 1 Playwright spec and fails the run. The research's documented colocation pattern (`src/**/__tests__/*.test.ts`) is exactly this scope, so the include is faithful to the plan's intent while fixing the collision.
- **`passWithNoTests: true`** — Vitest 4 exits 1 when no test files exist; the plan's acceptance criterion requires `pnpm exec vitest run` to exit 0 pre-tests. Config flag keeps the pinned script string `"test:unit": "vitest run"` byte-exact.
- **No `vitest.config.ts`** — config extends the existing `vite.config.ts` per the plan's zero-config prohibition; `defineConfig` switched to `vitest/config` (the Vitest-documented way to type a `test` block in vite.config.ts).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest default glob collides with Phase 1 Playwright spec**
- **Found during:** Task 2 (install + test:unit script)
- **Issue:** `pnpm exec vitest run` picked up `tests/parity.spec.ts` (Playwright spec matching vitest's default `**/*.spec.ts` include) and failed the run — the plan's "zero-config" assumption did not hold on this repo, violating acceptance criterion "vitest run exits 0".
- **Fix:** Added a `test` block to the existing `vite.config.ts`: `include: ['src/**/*.test.ts']` (the research's own colocation pattern), and `passWithNoTests: true` for the empty-suite case. No new config file, no environment/globals config — both plan prohibitions honored.
- **Files modified:** vite.config.ts
- **Verification:** `pnpm exec vitest run` exits 0; `pnpm lint` exits 0; `pnpm typecheck` exits 0
- **Committed in:** b894438 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was necessary for the plan's own acceptance criteria to pass; no scope creep. Phase 1 gates untouched and verified (parity 4/4 green).

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Unit-test toolchain installed, scripted, and CI-gated — plans 02-02 (LINE-03), 02-03 (STOR-01/02), 02-04 (STOR-03/04) can write Vitest fixtures against `src/**/__tests__/*.test.ts` immediately
- zod 4.4.3 available for the schema-first model restructure in 02-02
- fake-indexeddb 6.2.5 available for Dexie repo tests in 02-03
- Phase 1 parity contract unregressed (4/4 golden baselines pass)

---
*Phase: 02-domain-core-persistence*
*Completed: 2026-08-07*

## Self-Check: PASSED

- `02-01-SUMMARY.md` exists on disk
- Task commit `b894438` present in git log
- Task commit `5ec2a22` present in git log
- Plan-level verification re-run green: exact pins, `vitest run` exit 0, `pnpm lint` exit 0, `pnpm typecheck` exit 0, parity suite 4/4 passed
