---
phase: 02-domain-core-persistence
plan: 03
subsystem: database
tags: [dexie, indexeddb, persistence, repos, fake-indexeddb, storage]

# Dependency graph
requires:
  - phase: 02-domain-core-persistence
    provides: vitest + fake-indexeddb toolchain with `test:unit` script (02-01)
  - phase: 02-domain-core-persistence
    provides: schema-first DocumentModel (Zod z.infer) that repos.ts types against (02-02)
provides:
  - Dexie version(2) five-table schema (company, customers, catalog, documents, preferences) on the existing `paperchaser` instance — version(1) line untouched
  - Five per-table repos (documentsRepo, companyRepo, customersRepo, catalogRepo, preferencesRepo) as the only Dexie touchpoints (Pattern 4)
  - Unit-level STOR-01/02 proof: 12 fake-indexeddb repo tests green
  - Browser-platform reload-survival proof (STOR-01/02): UMD Dexie write survives page.reload() in real Chromium
affects: [02-04, phase 03, phase 04, phase 05, phase 06]

# Actuals (#2632) — pairs with the plan's estimate (30000 tokens) to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 3006
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Repos as the only Dexie touchpoints (Pattern 4): nothing outside src/db/repos.ts reads/writes db tables; tests drive db only for the documented delete/open fixture"
    - "Dexie versioning discipline: shipped version lines are byte-immutable — a diff guard greps `version(1).stores` across the plan's commits"
    - "fake-indexeddb/auto must be the FIRST import in repo tests (before dexie) — the README-documented pairing"
    - "id-keyed tables (not ++id) for import/export ID stability; index only where()-queried properties"
    - "Schema drift guard: authoritative check is the real db.ts import in Vitest; duplicated spec strings carry a MUST-match comment"

key-files:
  created:
    - src/db/repos.ts
    - src/db/__tests__/repos.test.ts
    - tests/persistence.spec.ts
  modified:
    - src/db/db.ts

key-decisions:
  - "Plain Dexie instance typed via one cast in repos.ts: `const db = rawDb as unknown as Tables`. The shipped dexie 4.4.4 typings expose table props ONLY on subclassed instances, and the plan requires `export const db = new Dexie('paperchaser')` to stay untouched — the cast keeps db.<table> access typed and matching the plan's traceability pattern"
  - "companyRepo stores the profile under a constant singleton id ('company') and strips it on read, so get() returns exactly the Company shape put() received — schema is id-keyed, domain Company has no id"
  - "customersRepo/catalogRepo introduce row types (CustomerRow extends Customer, CatalogItemRow) carrying the id the domain types lack; byName uses the real name index (Phase 5 search seam)"
  - "Reload-survival spec re-injects the UMD Dexie script after page.reload() and uses the full SCHEMA constant on both sides — the RESEARCH example omitted the re-inject (window.Dexie is undefined post-reload) and declared a documents-only schema on the read side"

patterns-established:
  - "Pattern: persistence seams are thin per-table repo modules wrapping db.<table>; the repos layer is where future phases (auto-save, backup/restore, dashboard) plug in"

requirements-completed: [STOR-01, STOR-02]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "Dexie version(2) five-table schema (company, customers, catalog, documents, preferences) id-keyed with future-query indexes; version(1) line byte-identical"
    verification:
      - kind: unit
        ref: "src/db/__tests__/repos.test.ts#version(2) declares exactly the five stores with id-keyed primary keys and future-query indexes"
        status: pass
      - kind: other
        ref: "git diff guard: `git diff | grep -c '^[+-].*version(1)\\.stores'` = 0 across the plan"
        status: pass
    human_judgment: false
  - id: D2
    description: "Five repos as the only Dexie touchpoints: documentsRepo put/get/delete/byStatus, companyRepo singleton get/put, customersRepo/catalogRepo put/get/delete/byName, preferencesRepo KV get/put/delete"
    verification:
      - kind: unit
        ref: "src/db/__tests__/repos.test.ts (12 tests: documents round-trip, byStatus, delete; company singleton replace + one-record; customers/catalog byName; preferences KV + missing-key)"
        status: pass
      - kind: other
        ref: "grep 'from .*db' src/ excluding tests and repos.ts -> empty (repos are the only touchpoints)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Reload-survival proof: a document written via Dexie (UMD injection) into real IndexedDB survives a full page.reload() in the same context, read back deep-equal"
    verification:
      - kind: e2e
        ref: "tests/persistence.spec.ts#document written via Dexie survives a full page reload"
        status: pass
    human_judgment: false

# Metrics
duration: 8min
completed: 2026-08-07
status: complete
---

# Phase 02 Plan 03: Dexie version(2) Schema + Repos + Reload-Survival Proof Summary

**Five IndexedDB stores (company, customers, catalog, documents, preferences) behind Dexie `version(2)` with the Phase 1 `version(1)` line byte-untouched; five per-table repos as the only persistence touchpoints; 12 fake-indexeddb unit tests and a real-Chromium `page.reload()` survival spec prove STOR-01/02 end-to-end.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-07T22:15:32Z (pre-first-commit)
- **Completed:** 2026-08-07T22:22:47Z
- **Tasks:** 3 (1 tracer + 1 TDD fixture task + 1 e2e spec)
- **Files modified:** 4

## Accomplishments

- `src/db/db.ts` — `db.version(2).stores({ company: 'id', customers: 'id, name', catalog: 'id, name', documents: 'id, type, status, updatedAt', preferences: 'key' })` appended; `version(1).stores({})` line byte-identical (diff guard = 0); stale "do not add tables" header comment rewritten to document the versioning contract. Indexes chosen for the queries Phase 4-6 are known to run (documents status/updatedAt → dashboard stats/recent, customers/catalog name → Phase 5 search)
- `src/db/repos.ts` — five repo modules (Pattern 4): `documentsRepo` (put/get/delete + `byStatus` index-backed where-query), `companyRepo` singleton (constant id key, put-replaces, get returns the Company shape), `customersRepo`/`catalogRepo` (put/get/delete + name-indexed `byName`), `preferencesRepo` KV (put/get/delete with typed generic get). Repos are the only Dexie touchpoints in production code — verified by grep
- `src/db/__tests__/repos.test.ts` — 12 fake-indexeddb tests: documents round-trip (deep-equal), byStatus filtering, delete-then-undefined, company singleton replace with one-record count, customers/catalog name-indexed queries, preferences KV + missing-key. Includes the authoritative schema drift guard (real `db.ts` import; asserts the five tables, id/key primary keys, and status/type/updatedAt + name indexes)
- `tests/persistence.spec.ts` — reload-survival e2e: UMD Dexie injected via `addScriptTag`, writes a schema-valid DOC through the version(2) schema, `page.reload()` in the SAME context (no fresh context — Pitfall 6), reads back deep-equal. Duplicated SCHEMA constant carries the "MUST match src/db/db.ts" drift-guard comment
- Full gate green at wave end: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` (34/34), `pnpm test` (parity 4/4 — Phase 1 contract held)

## Task Commits

Each task was committed atomically:

1. **Task 1: Dexie version(2) schema + repos — documents tracer (tracer, tdd)** - `330a124` (feat)
2. **Task 2: Full repo suite — company singleton, customers/catalog, preferences KV** - `0c88535` (test)
3. **Task 3: Reload-survival spec — real-browser persistence across reload** - `8af4864` (test)

**Plan metadata:** pending (docs: complete plan — committed after state updates)

## Files Created/Modified

- `src/db/db.ts` - EDIT: version(2) five-store schema appended; version(1) line and `export const db = new Dexie('paperchaser')` untouched; header comment updated (was stale "do not add tables/indexes here")
- `src/db/repos.ts` - NEW: `documentsRepo`, `companyRepo`, `customersRepo`, `catalogRepo`, `preferencesRepo` + row types (`CompanyRow`, `CustomerRow`, `CatalogItemRow`, `PreferenceRow`)
- `src/db/__tests__/repos.test.ts` - NEW: 12 fake-indexeddb tests incl. schema drift guard
- `tests/persistence.spec.ts` - NEW: reload-survival e2e (UMD Dexie injection)

## Decisions Made

- **Typed plain-Dexie via one cast** in repos.ts (`rawDb as unknown as Tables`): the plan pins `export const db = new Dexie('paperchaser')` untouched, and dexie 4.4.4's shipped typings expose table props only on subclassed instances — verified empirically (`db.documents` fails `tsc -b`). The single cast at the seam keeps `db.<table>` syntax (plan traceability pattern) with full types (e.g. `documentsRepo.get` returns `DocumentModel | undefined`)
- **companyRepo singleton contract**: store under constant `id: 'company'`, strip on read so `get()` deep-equals what `put()` received; "one profile" proven by `db.table('company').count() === 1` after a replace
- **Row types carry the id**: domain `Company`/`Customer` have no id field; the persistence layer defines `CompanyRow extends Company` / `CustomerRow extends Customer` / `CatalogItemRow` so id-keyed tables (ARCHITECTURE.md) and the `name` index work
- **preferencesRepo.get is generic** (`get<T>(key)`), returns `undefined` for missing keys — KV values are `unknown` (Dexie structured-clones any JSON-serializable value)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RESEARCH reload-survival example was not runnable as written**
- **Found during:** Task 3 (reload-survival spec)
- **Issue:** The RESEARCH Code Example omitted re-injecting the UMD Dexie script after `page.reload()` — reload drops injected script tags, so `new window.Dexie(...)` on the read side throws. It also declared a documents-only schema on the read side, which can mismatch the installed version(2) schema on open (SchemaError risk). Following the example verbatim would produce a red spec.
- **Fix:** Re-inject `node_modules/dexie/dist/dexie.js` after reload; use the full `SCHEMA` constant on both write and read sides (same schema, no-op upgrade on open).
- **Files modified:** tests/persistence.spec.ts
- **Verification:** `pnpm exec playwright test tests/persistence.spec.ts` green
- **Committed in:** 8af4864 (Task 3 commit)

**2. [Rule 3 - Blocking] Plain Dexie instance has no typed table props**
- **Found during:** Task 1 (repos.ts)
- **Issue:** `db.documents` fails `tsc -b` — the shipped dexie 4.4.4 typings type table props only on subclassed instances, but the plan pins `new Dexie('paperchaser')` untouched. The RESEARCH skeleton's `db.documents.put(doc)` does not compile.
- **Fix:** Single cast in repos.ts: `const db = rawDb as unknown as Tables` (interface with the five typed tables). Keeps `db.<table>` access, the plan's grep traceability, and full return types.
- **Files modified:** src/db/repos.ts
- **Verification:** `pnpm typecheck` green; repos tests green
- **Committed in:** 330a124 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were necessary for the plan to run at all (uncompilable RESEARCH example, untyped plain-Dexie access). No scope creep; schema and repo shapes follow the plan exactly.

## TDD Gate Compliance

Task 1 (tracer) carries `tdd="true"` but the tracer-first structure makes the RED state "module absent" rather than "test failing": the test file's `import { documentsRepo } from '../repos'` fails resolution until repos.ts exists (verified RED: vitest failed with `Cannot find module '../repos'` before implementation, then went green 4/4). Consequently the tracer is one `feat(02-03)` commit (`330a124`) containing both the tests and the implementation — the same sequencing the 02-02 plan documented and accepted. The behaviors RED would have pinned are all asserted by the committed tests: put/get deep-equal round-trip, byStatus index filtering, delete semantics, and the schema drift guard. Task 2 committed its fixture extensions as `test(02-03)` (`0c88535`). Test quality and coverage match the plan; only the commit split differs.

## Issues Encountered

- **Schema drift guard self-caught an inline-comment violation:** an early draft put `// NEVER alter — shipped in Phase 1` on the version(1) line, which made `git diff | grep -c '^[+-].*version(1)\.stores'` return 2 (guard requires 0). The trailing comment was removed and the version(1) line restored byte-identical before committing — the guard caught its own target. Committed state passes the guard (count 0).
- **Plan verification grep needs a test-exclusion refinement:** the plan's stray-import check `grep -rn "from '.*db'" src/ | grep -v "src/db/repos"` flags `src/db/__tests__/repos.test.ts:9` (`import { db } from '../db'`) — but the plan's own task 1 action mandates that import for the `beforeEach` delete/open fixture (RESEARCH example shows the same). Production code has zero stray db imports; the "repos are the only touchpoints" truth holds. Future plans should add `--exclude='*.test.ts'` or filter the colocated repo test.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- STOR-01/02 delivered and proven at two levels: fake-indexeddb unit round-trips (12 tests) and a real-Chromium reload-survival e2e
- Schema indexes are set for the phases that follow: documents `status`/`updatedAt` (Phase 6 dashboard stats/recent), customers/catalog `name` (Phase 5 search)
- `repos.ts` is the storage seam Phase 4 (auto-save) and Phase 6 (backup/restore) build on; `preferencesRepo` KV is ready for app preferences
- 02-04 (envelope import/export) validates against the `documentSchema` 02-02 restructured; no interaction with the repos layer

---

*Phase: 02-domain-core-persistence*
*Completed: 2026-08-07*
