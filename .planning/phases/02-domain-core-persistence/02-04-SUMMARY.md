---
phase: 02-domain-core-persistence
plan: 04
subsystem: api
tags: [zod, json, import-export, envelope, boundary, validation]

# Dependency graph
requires:
  - phase: 02-domain-core-persistence
    provides: schema-first documentSchema with logo refine + CURRENCY_DECIMALS currency enum (02-02)
provides:
  - Versioned-envelope export/import boundary (STOR-03/04, D-13/D-14): `exportDocument` validate-then-serialize, `parseDocument` three-stage validation with structured ImportError codes
  - Structured rejection contract { code, path, expected, received } (UI-SPEC E1) consumed by Phase 6 backup/restore UX copy
  - Boundary hardening: integer-minor-unit precision enforcement, DoS size cap, nested unknown-strip, logo URL refine inheritance
affects: [phase 06, phase 03, phase 04]

# Actuals (#2632) — pairs with the plan's estimate (28000 tokens). Same estimateTokens scale (chars/4 over the realized diff).
actuals:
  tokens: 2938
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-stage boundary validation (JSON syntax -> envelope literals -> document schema), each mapping to a distinct ImportError code — never parse-throw at the untrusted-input seam"
    - "Path-based envelope-vs-document branch discrimination: the envelope schema has only format/version/document keys, so `path[0] !== 'document'` is an envelope reject (robust to Zod's runtime literal code)"
    - "Raw Zod-4 issue-shape read via one cast: the public $ZodIssue union hides expected/received/keys, so the mapper reads the raw issue object (RESEARCH's direct access does not typecheck)"

key-files:
  created:
    - src/document/io.ts
    - src/document/__tests__/io.test.ts

key-decisions:
  - "ImportError carries keys on BOTH invalid_envelope and schema_mismatch: the plan's own unrecognized_keys branch instruction returns `{ code: 'invalid_envelope', path, keys }`, so the type must permit it on that member (plan's pinned type only had it on schema_mismatch — an internal inconsistency resolved toward the plan's branch behavior)"
  - "Zod 4.4.3 runtime literal-reject code is `invalid_value` (with `values[]`), not `invalid_literal_value` as RESEARCH stated; and Zod 4 issues omit `received` on most rejections (it lives only in the human message). The path-based branch logic absorbs both — the mapper never switches on the literal code, so behavior is exactly as the plan specifies"
  - "MAX_JSON_LENGTH (5,000,000 chars) raw-length cap before JSON.parse — cheap bounded DoS guard (T-02-04-DOS) with a ponytail comment naming the streaming-parse upgrade path"

patterns-established:
  - "Pattern: the import boundary is the ONLY place untrusted JSON enters the model; safeParse everywhere on the import path, exactly one `.parse(` (exportDocument's pre-serialize validation) — grep-enforced by the plan verification"

requirements-completed: [STOR-03, STOR-04]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "Versioned envelope export/import: exportDocument wraps in { format: 'paperchaser-document', version: 1, document }, validating before serialize; parseDocument round-trips any model losslessly"
    requirement: STOR-03
    verification:
      - kind: unit
        ref: "src/document/__tests__/io.test.ts#envelope export — STOR-03 (D-13)"
        status: pass
      - kind: unit
        ref: "src/document/__tests__/io.test.ts#lossless round-trip — STOR-03 (Pitfall 3)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Structured three-code rejection + unknown-strip at the boundary: invalid_json (syntax), invalid_envelope (format/version literals), schema_mismatch with concrete document-prefixed path (UI-SPEC E1); unknown fields stripped (D-14)"
    requirement: STOR-04
    verification:
      - kind: unit
        ref: "src/document/__tests__/io.test.ts#boundary rejection — STOR-04"
        status: pass
    human_judgment: false
  - id: D3
    description: "Boundary hardening: fractional minor-unit money rejected (no coercion), oversized payload rejected pre-parse (DoS guard), JPY receipt with discounts + shipping round-trips, nested unknowns stripped at depth, external logo URL rejected at the logo path"
    verification:
      - kind: unit
        ref: "src/document/__tests__/io.test.ts#boundary hardening — precision, size guard, breadth, nested strip, logo refine"
        status: pass
    human_judgment: false

# Metrics
duration: 13min
completed: 2026-08-07
status: complete
---

# Phase 02 Plan 04: Versioned Envelope Import/Export Boundary Summary

**`src/document/io.ts` — the phase's only untrusted-input surface: `exportDocument` validates-then-serializes into the D-13 envelope `{ format: 'paperchaser-document', version: 1, document }`; `parseDocument` runs three-stage validation (JSON syntax → envelope literals → document schema) and returns a structured `{ code, path, expected, received }` rejection (STOR-04, UI-SPEC E1). 15 boundary tests pin lossless round-trip, all three rejection codes, integer-minor-unit precision, the DoS size cap, nested unknown-strip, and the inherited logo-URL refine.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-07T22:35:22Z
- **Completed:** 2026-08-07T22:48:00Z
- **Tasks:** 2 (1 tracer + 1 hardening, both tdd)
- **Files modified:** 2

## Accomplishments

- `src/document/io.ts` — `envelopeSchema` (format/version literals + `documentSchema`), `type ImportError` discriminated union (`invalid_json | invalid_envelope | schema_mismatch`), `exportDocument(doc): string` (validate-then-serialize — the ONE allowed `.parse(`, fails loudly in dev, never exports an invalid doc), `parseDocument(json): ParseResult` (safeParse only, never throws, never partially returns). Envelope-level rejects are discriminated by `path[0] !== 'document'` — robust to Zod 4.4.3's actual runtime literal code (`invalid_value` + `values[]`, not RESEARCH's `invalid_literal_value`). `MAX_JSON_LENGTH` (5M chars) raw-length cap before `JSON.parse` rejects oversized payloads as `invalid_json` (T-02-04-DOS), with a ponytail comment naming the streaming-parse upgrade path. Unknown keys are stripped at both envelope and document levels (D-14, `z.object()` default).
- `src/document/__tests__/io.test.ts` — 15 tests: envelope shape (exactly format/version/document), lossless round-trip deep-equality for BOTH `FIXTURE_MAP` fixtures, all three rejection codes (invalid_json garbage, invalid_envelope wrong format + wrong version, schema_mismatch missing/typo'd/wrong-type field each asserting the exact document-prefixed path and expected type), unknown-top-level-field strip, then the hardening block: fractional `unitPriceMinor: 100.5` → schema_mismatch at `['document','lineItems',0,'unitPriceMinor']` (no coercion), oversized input → invalid_json, JPY receipt with per-line + document discounts + two shipping/fees round-tripping losslessly, nested unknown strip inside line items and company, and an `http://` logo URL → schema_mismatch at `['document','company','logo']` (T-02-02-LOGO refine inherited from types.ts).
- Wave gate green: `pnpm exec vitest run src/document/__tests__/io.test.ts` 15/15, `pnpm lint` OK, `pnpm typecheck` OK, `pnpm test:unit` 49/49, `pnpm test` parity 4/4 (Phase 1 contract held).

## Task Commits

Each task was committed atomically (TDD RED → GREEN per task):

1. **Task 1 RED: envelope export/import boundary tests** - `59baaa4` (test)
2. **Task 1 GREEN: versioned envelope export/import boundary (io.ts)** - `10c1205` (feat)
3. **Task 2 RED: hardening fixtures — precision, size guard, JPY breadth, nested strip, logo refine** - `0085d52` (test)

**Plan metadata:** pending (docs: complete plan — committed after state updates)

_Note: Task 2's GREEN (the MAX_JSON_LENGTH cap) has no separate commit — see TDD Gate Compliance._

## Files Created/Modified

- `src/document/io.ts` - NEW: `envelopeSchema`, `ImportError` union, `exportDocument`, `parseDocument`, `MAX_JSON_LENGTH`; pure module (no React/DOM/Dexie)
- `src/document/__tests__/io.test.ts` - NEW: 15 round-trip + boundary-rejection + hardening tests (colocated, explicit vitest imports)

## Decisions Made

- **`keys` on the `invalid_envelope` member too**: the plan's pinned `ImportError` type puts `keys?` only on `schema_mismatch`, but the plan's own `unrecognized_keys` branch instruction returns `{ code: 'invalid_envelope', path, keys }`. The type was extended to carry `keys?: string[]` on both members so the plan's specified branch behavior typechecks. (Defensive branch — with `z.object()` strip at both levels it cannot fire, matching RESEARCH's note.)
- **Raw Zod-4 issue-shape read**: the public `$ZodIssue` union in zod 4.4.3 does not expose `expected`/`received`/`keys` statically (verified empirically via tsc), so the mapper reads `issues[0]` through one `as unknown as { ... }` cast. This keeps the exact branch logic the plan specifies without changing behavior.
- **Runtime literal-reject code**: Zod 4.4.3 emits `invalid_value` (with `values[]`) for wrong envelope literals, not RESEARCH's `invalid_literal_value`; `received` is absent from most Zod 4 issues (it lives only in the message). The path-based branch (`path[0] !== 'document'`) handles both correctly, and the `ImportError` contract keeps `received?` optional as pinned.
- **Cap delivered early**: the DoS size guard landed in the task-1 GREEN commit because the tracer scaffolded the complete `io.ts` per RESEARCH. Task 2's RED was still verified genuinely (cap pulled from the working tree → the size-guard test failed 1/15; restored → 15/15). Net diff vs HEAD was zero, so no separate feat commit was possible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RESEARCH error-mapper skeleton does not typecheck against zod 4.4.3**
- **Found during:** Task 1 (io.ts implementation)
- **Issue:** The RESEARCH skeleton's `first.expected` / `first.received` / `first.keys` direct access fails `tsc -b`: the public `$ZodIssue` union in zod 4.4.3 declares none of these properties (verified empirically — `Property 'expected' does not exist on type '$ZodIssueTooBig<unknown>'`, etc.), and `first.path` is `PropertyKey[]` (includes `symbol`), unassignable to the plan's `(string | number)[]`. Additionally the plan's pinned `ImportError` type omits `keys` from the `invalid_envelope` member while the plan's own `unrecognized_keys` branch returns it — an internal inconsistency that also failed typecheck.
- **Fix:** Read the raw issue shape through one `as unknown as { code, path, expected?, received?, keys? }` cast in the mapper; widened `invalid_envelope` to carry `keys?: string[]`. Branch logic unchanged from the plan's exact specification.
- **Files modified:** src/document/io.ts
- **Verification:** `pnpm typecheck` green; 15/15 boundary tests green
- **Committed in:** 10c1205 (Task 1 GREEN)

**2. [Rule 1 - Bug] RESEARCH's `invalid_literal_value` code does not match the Zod 4.4.3 runtime**
- **Found during:** Task 1 (wrong-literal tests)
- **Issue:** RESEARCH stated envelope literal rejects surface as `invalid_literal_value`; the zod 4.4.3 runtime actually emits `invalid_value` with a `values[]` array and no `expected`/`received` (verified: `{"code":"invalid_value","values":["paperchaser-document"],"path":["format"]}`). Following RESEARCH's code-switching approach would have mislabeled the reject.
- **Fix:** No code change needed — the plan's path-based branch (`path[0] !== 'document'` → `invalid_envelope`) is code-agnostic and maps the real issue correctly. The mapper never switches on the literal code.
- **Files modified:** none (behavior absorbed by the planned branch logic)
- **Verification:** wrong-format and wrong-version tests assert `invalid_envelope` with `path: ['format']` / `['version']` — green
- **Committed in:** 10c1205 (Task 1 GREEN)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for the plan to compile and behave as specified; neither changed the plan's contract (envelope shape, rejection codes, branch logic, unknown-strip). No scope creep.

## TDD Gate Compliance

Task 1 (tracer, `tdd="true"`): RED `59baaa4` (test) — genuine RED: `import { exportDocument, parseDocument } from '../io'` failed module resolution until io.ts existed. GREEN `10c1205` (feat) — 10/10 green, typecheck green.

Task 2 (`tdd="true"`): RED `0085d52` (test) — genuine RED verified by pulling the size cap out of the working tree: 14/15 passed with exactly the oversized-input test failing. GREEN had no separate commit: the cap was already in history from `10c1205` (the task-1 tracer scaffolded the complete `io.ts` per RESEARCH's code example, which includes the optional payload cap the plan assigns to task 2). Restoring the cap after the RED verification produced a zero net diff vs HEAD — an empty feat commit was not possible. All five task-2 behaviors are asserted by committed tests, and the gate sequence test→implementation holds for the boundary as a whole: `59baaa4` (test) precedes `10c1205` (feat). The only divergence is that the cap's implementation commit predates its dedicated hardening test by one commit — documented rather than faked.

## Issues Encountered

- **Commit-time confusion over the missing cap commit:** after task 2's RED, re-adding the cap to io.ts produced "no changes added to commit" — the cap was already in committed history (`10c1205`), so the working tree matched HEAD. Verified via `git show 10c1205:src/document/io.ts` (cap present) and `git diff --stat 10c1205 0085d52` (only the test file differs). No work was lost; the commit plan simply over-counted.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- STOR-03/04 delivered: lossless versioned-envelope export/import with structured three-code rejection, unknown-strip (D-14), precision enforcement, and the DoS size guard — the boundary Phase 6 workspace backup/restore (STOR-05/06) reuses unchanged (envelope is the migration seam, D-13)
- The `envelopeSchema` + `ImportError` union are the copy-derivation source for Phase 6 import-error UI (UI-SPEC E1)
- Phase 1 parity held at wave end (4/4), full unit suite 49/49, lint/typecheck green
- 02-04 was the phase's last plan — Phase 2 domain core + persistence complete, ready for Phase 3 (Render Pipeline)

---

*Phase: 02-domain-core-persistence*
*Completed: 2026-08-07*

## Self-Check: PASSED

- All 2 plan files exist on disk: `src/document/io.ts`, `src/document/__tests__/io.test.ts`; SUMMARY at `.planning/phases/02-domain-core-persistence/02-04-SUMMARY.md`
- Task commits present: `59baaa4` (test), `10c1205` (feat), `0085d52` (test)
- Plan-level verification re-run green at final gate: `pnpm exec vitest run src/document/__tests__/io.test.ts` 15/15, `pnpm lint` OK, `pnpm typecheck` OK, `pnpm test:unit` 49/49, `pnpm test` (parity) 4/4
- Grep gates: `\.parse(` in io.ts = only `documentSchema.parse(doc)` (line 45) plus the raw `JSON.parse(json)` — no Zod parse on the import path; `\.flatten()|\.strict()|\.passthrough()` in `src/document/` = 0 matches
