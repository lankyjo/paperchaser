---
phase: 02-domain-core-persistence
verified: 2026-08-08T11:20:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
gaps: []
deferred: []
---

# Phase 2: Domain Core & Persistence Verification Report

**Phase Goal:** The document model, totals engine, and local persistence behave correctly with no user interface built yet — the parity contract every later phase consumes.
**Verified:** 2026-08-08T11:20:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

**Verdict:** The phase goal is achieved in code. All four ROADMAP success criteria hold with behavioral evidence run in this verification session: the full unit suite (49/49), the real-Chromium reload-survival e2e (1/1), and the Phase 1 parity contract (4/4). The single derived `computeTotals` engine, the integer-minor-unit money layer, the five-table Dexie version(2) persistence layer, and the versioned-envelope import/export boundary all exist, are substantive, wired, and behaviorally proven.

### Observable Truths

| #   | Truth   | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | **SC1** — Totals (subtotal, tax, shipping, fees, discount, grand total) are computed by ONE derived engine `computeTotals` in the domain core and never go out of sync across invoice/quote/receipt (LINE-03) | ✓ VERIFIED (behavioral) | `src/document/totals.ts:39` — single `computeTotals` computes all six (lineNets, subtotalMinor, discountMinor, discountedSubtotalMinor, shippingFeesMinor, taxByRate, taxMinor, grandTotalMinor); `src/components/DocumentPage.tsx:3,38` imports and consumes it (no inline copy — grep for `function computeTotals` in src/components/ empty; grep for `grandTotalMinor\|subtotalMinor\|computeTotals` outside totals.ts/DocumentPage empty = no second engine). Structural param is type-agnostic and `types.ts:72` type enum covers `['invoice','quote','receipt']` — one engine serves all three document types. Unit fixtures (totals.test.ts) pin per-line rounding order, discount semantics, shipping/fee grouping, and the Σ lineNets == subtotalMinor reconciliation invariant — all ran green this session. |
| 2   | **SC2** — Money math uses integer minor units with per-currency decimals (JPY 0dp, EUR 2dp) and a single per-line rounding policy, verified by unit-test fixtures | ✓ VERIFIED (behavioral) | `src/document/money.ts:9` — `CURRENCY_DECIMALS = { EUR: 2, JPY: 0 }`; `money.ts:17` — `roundMinor` half-away-from-zero (the single rounding primitive; bare `Math.round` appears only inside roundMinor itself and in a test comment). `totals.ts:46-54` — per-line rounding before summation; `totals.ts:66` — tax on the ROUNDED net (D-03). Fixtures pin: negative .5 tie → −3 (not Math.round's −2), positive tie → 3, JPY 0dp case (37035), EUR 2dp case (subtotal 100 / grand total 119), tax-on-rounded-net divergence case (21 vs 20), reconciliation invariant. Ran green in `pnpm exec vitest run` (49/49) this session. |
| 3   | **SC3** — Company profile, customers, product catalog, documents, and preferences persist in IndexedDB and survive a full page reload (STOR-01, STOR-02) | ✓ VERIFIED (behavioral) | `src/db/db.ts:16-22` — Dexie `version(2)` declares exactly the five tables (company `'id'`, customers `'id, name'`, catalog `'id, name'`, documents `'id, type, status, updatedAt'`, preferences `'key'`); `version(1).stores({})` line byte-untouched (present at db.ts:12). `src/db/repos.ts` — five repo modules; grep confirms no Dexie touchpoints outside repos.ts/db.ts. 12 fake-indexeddb repo tests (round-trips, byStatus, singleton company, byName queries, KV, schema drift guard) green. **Reload-survival proven behaviorally**: `tests/persistence.spec.ts` ran green in real Chromium this session — UMD Dexie writes a schema-valid document, `page.reload()` in the SAME context (no fresh context), read back deep-equal. |
| 4   | **SC4** — A single document can be exported to JSON and imported back losslessly; malformed or schema-invalid imports are rejected at the boundary (STOR-03, STOR-04) | ✓ VERIFIED (behavioral) | `src/document/io.ts` — `exportDocument` validates via `documentSchema.parse` then wraps in `{ format: 'paperchaser-document', version: 1, document }` (io.ts:44-47); `parseDocument` runs three-stage validation (JSON syntax → envelope literals → document schema) with `safeParse` only, mapping each failure to `invalid_json` / `invalid_envelope` / `schema_mismatch` with `{ path, expected, received }` (io.ts:53-87); `MAX_JSON_LENGTH` DoS cap; unknown keys stripped (D-14). 15 io.test.ts fixtures pin: lossless deep-equal round-trip for BOTH FIXTURE_MAP fixtures + a JPY receipt with discounts/shipping, all three rejection codes with exact paths, fractional-money precision reject, oversized-input reject, nested unknown-strip, external-logo-URL reject. All ran green this session. |

**Score:** 4/4 truths verified (0 present, behavior-unverified — every behavior-dependent truth was exercised by a passing test run in this session)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/document/types.ts` | Schema-first Zod document model, exported names preserved | ✓ VERIFIED | `documentSchema` + `lineItemSchema`/`discountSchema`/`shippingFeeSchema`/`companySchema`/`customerSchema`/`logoSchema`; `z.infer` exports `DocumentModel`/`LineItem`/`Company`/`Customer`; type/status/currency enums; logo data-URL refine (T-02-02-LOGO); Zod 4 API only (no `.strict()/.flatten()/.passthrough()` — grep empty) |
| `src/document/money.ts` | Currency registry + single rounding primitive | ✓ VERIFIED | `CURRENCY_DECIMALS = { EUR: 2, JPY: 0 }`; `roundMinor` half-away-from-zero; pure module |
| `src/document/totals.ts` | Single derived totals engine + deriveWatermark | ✓ VERIFIED | `computeTotals(doc)` with per-line rounding, both discount levels/kinds, shipping/fees line-like, taxByRate grouping; `deriveWatermark(status)` maps draft→'draft', sent/paid→null; pure module |
| `src/components/DocumentPage.tsx` | Consumes domain engine; inline copy deleted | ✓ VERIFIED | Imports `computeTotals`/`deriveWatermark` (line 3), calls `computeTotals(model)` (line 38), watermark via `deriveWatermark(model.status)` (line 42), per-line printed amount via `totals.lineNets[index]` (line 96) — line and totals reconcile |
| `src/document/fixtures.ts` | `status` replaces `watermark`; parity fixtures intact | ✓ VERIFIED | Both FIXTURE_MAP entries use `status: 'draft'` / `'paid'`; LOGO_DATA_URL and fixture shapes intact; both fixtures parse via documentSchema (unit-tested) |
| `src/document/__tests__/totals.test.ts` | LINE-03 unit fixtures | ✓ VERIFIED | 22 tests; half-away-from-zero ties incl. negative, per-line rounding, EUR/JPY, tax-on-rounded-net, reconciliation, discounts, shipping grouping, schema acceptance, logo refine — all green |
| `src/db/db.ts` | Dexie version(2) five-table schema | ✓ VERIFIED | Exactly the five declared tables id-keyed; version(1) line untouched; indexes match future-query plan (status/updatedAt/name) |
| `src/db/repos.ts` | Five per-table repos — only Dexie touchpoints | ✓ VERIFIED | documentsRepo (put/get/delete/byStatus), companyRepo (singleton), customersRepo/catalogRepo (put/get/delete/byName), preferencesRepo (KV generic); grep: no stray db imports in production code |
| `src/db/__tests__/repos.test.ts` | STOR-01/02 repo CRUD fixtures | ✓ VERIFIED | 12 tests incl. authoritative schema drift guard (real db.ts import) — all green |
| `tests/persistence.spec.ts` | Reload-survival e2e | ✓ VERIFIED | UMD Dexie injection, `page.reload()` same context, no `newContext`, SCHEMA constant with "MUST match src/db/db.ts" comment — passed in real Chromium this session |
| `src/document/io.ts` | Versioned envelope export/import boundary | ✓ VERIFIED | `envelopeSchema` (format/version literals), `ImportError` discriminated union, `exportDocument` (one allowed `.parse(`), `parseDocument` (safeParse only), `MAX_JSON_LENGTH` cap with ponytail comment; pure module |
| `src/document/__tests__/io.test.ts` | STOR-03 round-trip + STOR-04 boundary fixtures | ✓ VERIFIED | 15 tests covering envelope shape, lossless round-trip (3 docs), three rejection codes with paths, unknown-strip, precision/DoS/nested/logo hardening — all green |
| `package.json` | test:unit script + exact pins | ✓ VERIFIED | `"test:unit": "vitest run"`; `zod: 4.4.3` (deps), `vitest: 4.1.10` + `fake-indexeddb: 6.2.5` (devDeps); Phase 1 `test`/`test:update` scripts intact |
| `.github/workflows/ci.yml` | CI unit gate in declared order | ✓ VERIFIED | Header comment "install -> lint -> typecheck -> unit tests -> build -> parity test"; `pnpm test:unit` step (line 20) between typecheck (19) and build (21); no step reordering |
| `vite.config.ts` | Vitest config scoped to src tests | ✓ VERIFIED | include `src/**/*.test.ts`, `passWithNoTests: true`; no separate vitest.config.ts |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `DocumentPage.tsx` | `document/totals.ts` | `import { computeTotals, deriveWatermark }` — single import site | ✓ WIRED | Line 3 import; line 38/42 usage; no inline engine |
| `totals.ts` | `money.ts` | `CURRENCY_DECIMALS + roundMinor` imports | ✓ WIRED | Line 12; engine's only rounding path |
| `types.ts` | `money.ts` | currency enum from `CURRENCY_DECIMALS` keys | ✓ WIRED | Line 11 import, line 74 enum |
| `io.ts` | `types.ts` | `documentSchema` import — source of truth for the document branch | ✓ WIRED | Line 12; envelope reuses it |
| `repos.ts` | `db.ts` | `import { db } from './db'` — repos wrap db tables | ✓ WIRED | Line 9; all five repos route through the cast instance |
| `repos.ts` | `document/types.ts` | `DocumentModel` type for documentsRepo signatures | ✓ WIRED | Line 8 import; `Table<DocumentModel>` |
| `persistence.spec.ts` | `db.ts` | duplicated SCHEMA with MUST-match comment | ✓ WIRED | Line 3 comment; e2e passed against real IndexedDB |
| `io.test.ts` | `fixtures.ts` | FIXTURE_MAP round-trip fixtures | ✓ WIRED | Line 3 import; both fixtures round-trip |
| `ci.yml` | `package.json` | `pnpm test:unit` invokes the script | ✓ WIRED | Step 20; script exists at exact string |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `DocumentPage.tsx` | `model` / `totals` | `FIXTURE_MAP[key]` ← whitelisted `?fixture=` ← committed fixtures → `computeTotals(model)` | Yes — 18-item torture + 5-item simple fixtures, real line nets, tax, grand total | ✓ FLOWING (parity 4/4 green this session against the production build) |
| `io.ts` | `document` | `documentSchema`-validated input → JSON envelope → `parseDocument` back to model | Yes — real fixture data round-trips deep-equal | ✓ FLOWING |
| `repos.ts` | table rows | real Dexie instance (v2 schema) on fake-indexeddb (tests) / real IndexedDB (e2e) | Yes — put/get/delete/byStatus/byName/KV all return stored data | ✓ FLOWING (reload-survival e2e proves real-browser flow) |
| `persistence.spec.ts` | `DOC` | injected UMD Dexie → real IndexedDB → read back after reload | Yes — deep-equal across reload | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| SC1/SC2 totals + money fixtures (per-line rounding, ties, EUR/JPY, D-03, reconciliation, discounts, shipping) | `pnpm exec vitest run` | 49/49 passed (3 files: totals 22, repos 12, io 15) | ✓ PASS |
| SC3 repo CRUD on fake-indexeddb (5 repos, drift guard) | `pnpm exec vitest run src/db/__tests__/repos.test.ts` (within full run) | 12/12 passed | ✓ PASS |
| SC3 reload survival in real Chromium (same-context page.reload) | `pnpm exec playwright test tests/persistence.spec.ts` | 1/1 passed (2.8s) | ✓ PASS |
| SC4 lossless round-trip + three-code boundary rejection + hardening | `pnpm exec vitest run src/document/__tests__/io.test.ts` (within full run) | 15/15 passed | ✓ PASS |
| Phase 1 parity contract unregressed (preview==print==PDF, watermark/logo bands, baseline drift-free) | `pnpm test` | 4/4 passed (15.1s) | ✓ PASS |
| Lint gate | `pnpm lint` | exit 0 (1 pre-existing shadcn warning, tracked in deferred-items.md from Phase 1) | ✓ PASS |
| Typecheck gate | `pnpm typecheck` | exit 0, clean | ✓ PASS |
| Grep: no inline engine / no watermark field / no Zod 3 API / no bare Math.round in money code / no stray db imports | grep gates | all empty | ✓ PASS |

### Probe Execution

No probes declared in PLAN/SUMMARY for this phase (no `scripts/*/tests/probe-*.sh`); the unit suite, persistence e2e, and parity suite are the phase's executable proofs and were run directly in Step 7b. SKIPPED by absence.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| LINE-03 | 02-02 | Totals computed correctly, never out of sync | ✓ SATISFIED | Single `computeTotals` engine (totals.ts), renderer consumes it, 22 unit fixtures green; parity baselines unchanged |
| STOR-01 | 02-03 | Data persists locally in IndexedDB via Dexie | ✓ SATISFIED | db.ts version(2), 12 repo tests, reload-survival e2e green in real Chromium |
| STOR-02 | 02-03 | IndexedDB stores company/customers/catalog/documents/preferences | ✓ SATISFIED | Five tables declared (db.ts:16-22), drift-guard test asserts exact tables + id/key primaries + indexes |
| STOR-03 | 02-04 | User can export a single document as JSON | ✓ SATISFIED | `exportDocument` → versioned envelope; round-trip deep-equality on 3 documents |
| STOR-04 | 02-04 | User can import a single document from JSON | ✓ SATISFIED | `parseDocument` three-stage validation, three rejection codes with `{ path, expected, received }`, unknown-strip, precision/DoS/logo guards |

All five requirement IDs claimed by plans are accounted for and satisfied. No orphaned requirements — REQUIREMENTS.md's Phase-2 mapping (lines 184, 200-203) lists exactly these five IDs as Phase 2, all marked Complete, matching the verified codebase. (Note: STOR-05/STOR-06 workspace backup/restore remain Pending — correctly out of this phase's scope, assigned to Phase 6.)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | Debt markers (TBD/FIXME/XXX/HACK) | — | None found in phase files |
| — | — | Stub returns / placeholder text / empty implementations | — | None — the only `placeholder:` hit is a Tailwind CSS class in pre-existing shadcn `ui/input.tsx` (Phase 1 generated, not a stub) |
| — | — | console.log-only implementations | — | None in domain/db code |
| — | — | Bare Math.round in money code | — | Only inside `roundMinor` itself (the primitive) and a test comment — prohibition honored |
| `src/document/io.ts` | 36 | `ponytail:` comment (naive length cap, streaming-parse upgrade path named) | ℹ️ Info | Deliberate documented simplification of the DoS guard — cap is bounded, tested, and the upgrade path is stated |
| `src/components/ui/button.tsx` | 58 | `react/only-export-components` (warn-only, generated) | ℹ️ Info | Pre-existing shadcn output tracked in deferred-items.md from Phase 1 — not introduced by this phase |

### Human Verification Required

None. This is a zero-UI phase by design (goal states "no user interface built yet"), so no visual/user-flow human checks apply. All four success criteria are behavior-dependent and were each exercised by a passing automated test run in this session (unit suite, reload-survival e2e, parity suite).

*Informational note (not a gate item):* plan 02-01's zod package-legitimacy checkpoint was a `checkpoint:human-verify` blocking gate, recorded as human-approved in 02-01-SUMMARY.md ("4.4.3; yes; approved"). It is an execution-process record, not a codebase truth; the toolchain truth itself (exact pins, lockfile committed) is code-verified. Phase 1's outstanding human items (Safari paged-media acceptance, golden-baseline visual review) belong to Phase 1's gate and remain Phase 1's responsibility.

### Gaps Summary

**No gaps.** All four ROADMAP success criteria verified with behavioral evidence:
- SC1/SC2 (LINE-03): single derived engine, integer minor units, per-currency decimals, per-line rounding — 22 unit fixtures green
- SC3 (STOR-01/02): five-table Dexie v2 persistence behind repo-only touchpoints — 12 unit fixtures + real-Chromium reload-survival e2e green
- SC4 (STOR-03/04): versioned-envelope export/import with structured three-code rejection — 15 boundary fixtures green
- Regression contract: Phase 1 parity 4/4 green, lint/typecheck clean, CI gates `test:unit` in the documented order

Status is `passed`: every behavior-dependent truth has a passing behavioral test from this session; there are no human verification items and no gaps.

---

_Verified: 2026-08-08T11:20:00Z_
_Verifier: the agent (gsd-verifier)_
