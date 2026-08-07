# Phase 2: Domain Core & Persistence - Research

**Researched:** 2026-08-07
**Domain:** Pure document model + totals/money engine (integer minor units), IndexedDB persistence via Dexie, single-document JSON import/export via Zod — zero UI
**Confidence:** HIGH

## Summary

Phase 2 builds the pure domain core the product's parity contract depends on: one `DocumentModel` shared by invoice/quote/receipt (D-09), one derived totals engine with per-line rounding in integer minor units (D-01..D-08, D-12), the five IndexedDB stores behind `db.version(2)` (STOR-01/02), and a versioned, Zod-validated single-document JSON import/export boundary (STOR-03/04, D-13..D-15). The phase is zero-UI by locked decision — everything is Node-testable; the UI-SPEC adds exactly one non-visible contract: the import boundary must surface structured rejection reasons `{ code, path, expected, received }` so later phases can render copy without re-deriving it.

Three findings materially shape the plan. **First, the repo already contains a second, non-compliant totals engine**: `src/components/DocumentPage.tsx:27-37` hand-rolls `computeTotals(lineItems)` inside a React component — the exact anti-pattern PITFALLS.md:242 and ARCHITECTURE.md Anti-Pattern 1 forbid. LINE-03 ("computed by one derived engine and never go out of sync") requires Phase 2 to **replace** that inline function with the domain engine, not merely add a new one. For the current fixtures the swap is baseline-neutral (all fixture line nets are exact integers, so per-line rounding changes nothing — verified by reading the fixture arithmetic), so the committed golden images stay green. **Second, the Phase 1 model seed (`src/document/types.ts`) must be restructured schema-first**: D-15 makes Zod schemas the source of truth, so `types.ts` becomes Zod-schema definitions with `z.infer`-derived types, while keeping the existing exported names (`LineItem`, `Company`, `Customer`, `DocumentModel`) so `fixtures.ts` keeps compiling. The model gains `type: 'invoice' | 'quote' | 'receipt'` (D-09), `status` (D-11) — replacing `watermark`, which becomes a derived helper — per-line and document discounts (D-05/D-06), shipping/fees arrays (D-07/D-08), and the `currency` field now constrained to the EUR/JPY registry (D-12). **Third, the repo has no unit-test runner**: success criterion 2 ("verified by unit-test fixtures") requires adding Vitest 4.1.10 (verified: Vite ^8 peer, node env, zero-config with the existing `vite.config.ts`) plus `fake-indexeddb` 6.2.5 (its README explicitly documents Dexie compatibility via `import 'fake-indexeddb/auto'`) for repo tests, with a single Playwright spec for the reload-survival claim using a UMD-Dexie injection (the app bundle does not import `db.ts` today, so the spec drives real IndexedDB directly).

**Primary recommendation:** Split the phase work into (1) schema-first model restructure of `src/document/types.ts` + fixtures + the `DocumentPage` engine swap, (2) money/totals engine with exhaustive unit fixtures (EUR 2dp, JPY 0dp, per-line rounding, both discount levels, taxed/untaxed shipping, 0.1-quantity cases), (3) Dexie `version(2)` schema + repos, (4) envelope import/export with structured rejection, (5) Vitest + fake-indexeddb + Playwright persistence wiring and CI gate. Use **Zod 4.4.3** (verified npm) with the **new API** (`z.strictObject`/`z.looseObject`/`z.object`-strips-default — `.strict()`/`.passthrough()`/`.flatten()` are deprecated), round **half-away-from-zero** per line, and keep `db.version(1).stores({})` untouched (PITFALLS.md:78 discipline).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Document model (types + Zod schemas) | Domain core (pure) | — | Renderer-agnostic, JSON-serializable, no React/DOM/Dexie imports (established pattern, CONTEXT.md Code Context; D-15 makes Zod the source of truth) |
| Totals/money engine | Domain core (pure) | — | One derived `computeTotals` consumed by every later phase; the "never go out of sync" contract (LINE-03) is only achievable if no other tier computes totals |
| Currency/rounding policy | Domain core (pure) | — | Integer minor units + per-currency decimals (EUR 2dp, JPY 0dp) + single per-line rounding policy (D-01..D-03, D-12) |
| Status→watermark derivation | Domain core (pure) | — | Watermark derives from `status` (D-11); renderers call a domain helper, never read a stored watermark |
| IndexedDB persistence | Persistence layer (Dexie) | — | Five stores (STOR-02) behind `db.version(2)`; repos are the only Dexie touchpoints; versioning discipline starts here (PITFALLS.md:78) |
| JSON import/export boundary | Domain core (pure) | — | Zod envelope validation + structured rejection (STOR-03/04, D-13..D-15); re-used by Phase 6 workspace backup/restore (CONTEXT.md Integration Points) |
| Document rendering | Browser / Client | Domain core | Phase 3 owns rendering; but `DocumentPage.tsx` must *consume* the domain engine, not reimplement it (current inline `computeTotals` at DocumentPage.tsx:27 is the anti-pattern being eliminated) |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Line-item totals and the document subtotal are rounded **per line, then summed**. Each line total (qty × unit price, after line discount) rounds to the currency's minor-unit precision; the subtotal is the sum of the rounded line nets. Rounding happens once per line and never cascades.
- **D-02:** Prices are **tax-exclusive (net)** by default. Unit prices exclude tax; tax is added on top per line. No per-document net/gross toggle.
- **D-03:** Per-line tax = **rounded line net × line tax rate**, and that result rounds to minor units. The printed line amount and the totals below it always reconcile.
- **D-04:** Document tax total is **grouped by rate** (e.g., 19%: €X, 7%: €Y) in the model. Rendering may collapse it to one line, but the model retains the per-rate breakdown.
- **D-05:** Discounts exist at **both levels**: a per-line discount reducing that line, and a document-level discount applied to the subtotal after all line discounts.
- **D-06:** Each discount instance is **either percentage OR flat amount** (a `kind` of `percent | amount` and a value). Per-line and document-level discounts both follow this.
- **D-07:** Shipping and fees are **line-like entries with their own amount and optional tax rate** — a shipping charge can carry the same VAT rate as goods or be untaxed. The totals engine treats them uniformly.
- **D-08:** A document may have **multiple** shipping/fee entries (array), each with a label. They collapse into single totals.
- **D-09:** **One DocumentModel with a `type` tag** — `'invoice' | 'quote' | 'receipt'` — sharing one schema and one totals engine.
- **D-10:** Receipts use the **same fields** as invoices/quotes; semantic differences are expressed through status, not a separate shape. The totals engine stays one code path.
- **D-11:** Document status is an **explicit `status` field** — e.g., invoices/quotes `draft | sent | paid`, receipts start paid — and the watermark (`'draft' | null` in the Phase 1 model) **derives from status**, not the other way around. Dashboard stats read the status field directly.
- **D-12:** Phase 2 registers **EUR (2dp) and JPY (0dp)** in the currency registry, exercising both decimal policies as the success criteria requires. The engine is decimal-aware by design so additional currencies are registry entries, not model changes. (MONEY-01 multi-currency UX remains v2.)
- **D-13:** Exported JSON uses a **versioned envelope** — `{ format: 'paperchaser-document', version: 1, document: {...} }` — not a bare document object.
- **D-14:** The import boundary is **strict on shape, strips unknowns**. Required fields must match the schema exactly (malformed imports rejected, per STOR-04); unknown extra fields are dropped. Missing/extra data never silently corrupts a document.
- **D-15:** **Add Zod** for import/export schema validation. Its schemas are the source of truth for the document shape and provide the runtime type guards the boundary needs (PRD §7 pins Zod).

### the agent's Discretion
No "you decide" answers were given this session — all areas were locked by explicit choice.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LINE-03 | Totals (subtotal, tax, shipping, fees, discount, grand total) computed by one derived engine, never out of sync across invoice/quote/receipt | One pure `computeTotals` in the domain core (Pattern: Derived State, ARCHITECTURE.md); the inline copy in `DocumentPage.tsx:27` is eliminated in this phase; exhaustive Vitest fixtures per the algorithm in Code Examples |
| STOR-01 | Data persists locally in IndexedDB via Dexie | `db.version(2)` on the existing `paperchaser` instance; repos wrap the five tables; versioning discipline per Dexie docs (never alter shipped upgraders) |
| STOR-02 | IndexedDB stores company profile, customers, product catalog, documents, preferences | Five tables: `company`, `customers`, `catalog`, `documents`, `preferences` (CONTEXT.md table naming); `id`-keyed (not `++id`) for import/export ID stability (ARCHITECTURE.md §IndexedDB Schema) |
| STOR-03 | Export a single document as JSON | Versioned envelope `{ format: 'paperchaser-document', version: 1, document }` (D-13); export validates before serialize; round-trip lossless by construction (model is JSON-serializable, seed `types.ts` header) |
| STOR-04 | Import a single document from JSON; malformed/schema-invalid rejected at the boundary | Zod 4 boundary: JSON.parse failure → `invalid_json`; envelope literal mismatch → `invalid_envelope`; schema mismatch → `schema_mismatch` with `{ path, expected, received }` (UI-SPEC E1 contract); unknown keys stripped (D-14, Zod default `z.object()` behavior) |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | 4.4.3 | Schema validation; document shape source of truth + import/export boundary guards | Locked by D-15 / PRD §7; current major verified on npm today (2026-05-04 publish, matches STACK.md pin). Zod 4 API: `z.object()` strips unknowns by default (exactly D-14), `z.strictObject()` rejects, `.strict()`/`.passthrough()`/`.flatten()` deprecated [CITED: zod.dev/api + /v4/changelog] |
| Dexie | 4.4.4 | IndexedDB wrapper; schema versioning + transactions + live queries | Installed in Phase 1 (package.json); the standard, battle-tested IndexedDB library (STACK.md:26); version(2) schema owned by this phase [VERIFIED: npm registry] |
| Vitest | 4.1.10 | Unit-test framework for the domain core (money, totals, import/export, repos) | Success criterion 2 demands unit-test fixtures; Vitest is the Vite-native runner, requires Vite ≥6 + Node ≥20 (we have Vite 8, Node 24), reads `vite.config.ts` with zero extra config, default `node` environment fits pure TS tests [VERIFIED: npm registry peerDependencies + vitest.dev/guide] |
| fake-indexeddb | 6.2.5 | In-memory IndexedDB for node-env repo unit tests | README explicitly documents the Dexie pattern (`import 'fake-indexeddb/auto'` before `import Dexie`); 5.1M weekly downloads, clean verdict [VERIFIED: npm registry + package-legitimacy] |
| @playwright/test | 1.62.1 | Browser e2e: reload-survival persistence spec (STOR-01/02) + existing parity harness | Installed in Phase 1; Chromium-only scope documented in ADR 0002; reload persistence is verified by driving real IndexedDB via UMD Dexie (see Code Examples) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | ~6.0.3 (installed) | Language; `strict: true`, `verbatimModuleSyntax` | Zod `z.infer` types must use `import type`; tests colocated under `src/` are typechecked by `tsc -b` and never bundled (vite build only follows the entry graph) |
| oxlint | 1.77.x (installed) | Linter | No vitest-specific env configured; explicit `import { describe, it, expect } from 'vitest'` (Vitest's default — globals off) sidesteps undefined-global lint noise |
| pnpm | 11.20.0 | Package manager | Repo convention (pnpm-workspace.yaml, lockfile committed); CI uses `pnpm install --frozen-lockfile` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest 4.1.10 | Node built-in `node:test` + tsx loader | node:test needs a TS loader and custom config for the Vite project; Vitest is zero-config with `vite.config.ts` and is the ecosystem standard for Vite 8 projects |
| fake-indexeddb 6.2.5 | Real browser via Playwright for every repo test | Slow and heavyweight for CRUD units; fake-indexeddb is the documented Dexie pairing. Playwright keeps the one browser-dependent claim (reload survival) |
| Playwright-only persistence test (no Vitest) | All verification in Playwright | Pure domain tests (money math, Zod boundary) are faster and clearer in node; Playwright stays for the reload-survival e2e — the standard split |
| decimal.js / big.js for money | Integer minor units (locked D-01, seed model) | The model already stores money as integer minor units; only `quantity × unitPriceMinor` produces float intermediates, rounded once per line. No decimal lib needed — STACK.md:122 rejects money libs |

**Installation:**
```bash
pnpm add zod
pnpm add -D vitest fake-indexeddb
```

**Version verification (run today):** zod 4.4.3, vitest 4.1.10 (peer `vite: ^6.0.0 || ^7.0.0 || ^8.0.0` ✓), fake-indexeddb 6.2.5, dexie 4.4.4 — all verified via `npm view` this session [VERIFIED: npm registry].

## Package Legitimacy Audit

> Run via `gsd-tools query package-legitimacy check --ecosystem npm` (2026-08-07).

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod | npm | 5+ yrs (4.4.3 pub 2026-05-04) | unknown-downloads lookup artifact (registry query returned null) | github.com/colinhacks/zod | [SUS] | Flagged — **false positive**: `unknown-downloads` is a data-lookup artifact, not a real signal; verified against official zod.dev docs this session + no `postinstall` + not deprecated. Planner adds a `checkpoint:human-verify` (trivially passed) before install |
| vitest | npm | 4+ yrs | 88.4M/wk | github.com/vitest-dev/vitest | [OK] | Approved |
| dexie | npm | 10+ yrs | 2.1M/wk | github.com/dexie/Dexie.js | [OK] | Approved (already installed) |
| fake-indexeddb | npm | 10+ yrs | 5.1M/wk | github.com/dumbmatter/fakeIndexedDB | [OK] | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** zod — flagged by the recency/unknown-downloads heuristic only; the seam's own reason list contains no actual risk signal (no postinstall, real long-standing repo, official docs fetched this session). `checkpoint:human-verify` required by protocol before install; expected to pass on a 5-second look at npmjs.com/package/zod.

## Architecture Patterns

### System Architecture Diagram

The diagram shows data flow for the phase's two primary use cases (totals derivation and import/export) plus persistence — no UI is involved; every arrow crosses a pure-function or repo boundary that Phase 3+ consumes unchanged.

```
                        ┌──────────────────────────────────────────────┐
                        │           DOMAIN CORE (pure, no deps)         │
   ┌──────────────┐     │  ┌─────────────┐  ┌────────────────────────┐  │
   │ fixtures.ts  │────▶│  │ types.ts    │  │ money.ts / totals.ts   │  │
   │ (documents)  │     │  │ Zod schemas │  │ computeTotals()        │  │
   └──────────────┘     │  │ + z.infer   │  │ deriveWatermark()      │  │
                        │  └──────┬──────┘  └───────────┬────────────┘  │
                        │         │ schema is source    │ derived,      │
                        │         │ of truth (D-15)     │ never stored  │
                        └─────────┼─────────────────────┼───────────────┘
                                  │                     │
              ┌───────────────────▼─────────────┐ ┌─────▼──────────────────┐
              │  import/export.ts (envelope)     │ │  DocumentPage.tsx      │
              │  exportDocument() / parseDoc()   │ │  (Phase 1 renderer —   │
              │  Zod boundary + structured       │ │   CONSUMES engine,     │
              │  rejection {code,path,expected,  │ │   no longer reimplements│
              │   received} (UI-SPEC E1)         │ │   totals)              │
              └───────────────────┬──────────────┘ └───────────────────────┘
                                  │ STOR-03/04
              ┌───────────────────▼──────────────────────────────────────────┐
              │               PERSISTENCE LAYER (Dexie / IndexedDB)          │
              │  src/db/db.ts  version(2).stores({})                         │
              │   company · customers · catalog · documents · preferences    │
              │  src/db/repos.ts — table.repos (get/put/delete/toArray)      │
              └──────────────────────────────────────────────────────────────┘
```

Entry points: fixtures/tests and (from Phase 3 onward) UI call `computeTotals(model)` directly; the import/export boundary is the only place untrusted JSON enters; repos are the only writers to IndexedDB. No component other than `DocumentPage.tsx`'s existing inline copy computes totals — that copy is deleted in this phase.

### Recommended Project Structure

```
src/
├── document/             # pure domain core — NO React/DOM/Dexie imports
│   ├── types.ts          # RESTRUCTURED schema-first: Zod schemas + z.infer types
│   │                     # (keeps exported names LineItem/Company/Customer/DocumentModel)
│   ├── money.ts          # NEW: currency registry (EUR 2, JPY 0) + roundMinor()
│   ├── totals.ts         # NEW: computeTotals(), deriveWatermark() — pure, exhaustive fixtures
│   ├── io.ts             # NEW: exportDocument() / parseDocument() envelope boundary
│   └── fixtures.ts       # EXTENDED: type/status replace watermark; discount/shippingFees fields
├── db/
│   ├── db.ts             # EXTENDED: version(2).stores({...}) — version(1) line untouched
│   └── repos.ts          # NEW: company/customers/catalog/documents/preferences repos
├── components/
│   └── DocumentPage.tsx  # EDITED: import computeTotals + deriveWatermark from domain core
└── ... (unchanged: routes, app, lib)
tests/
└── persistence.spec.ts   # NEW: Playwright reload-survival (STOR-01/02), UMD Dexie
src/**/__tests__/*.test.ts  # NEW: Vitest units colocated with the code they test
```

### Pattern 1: Schema-First Model — Zod Schemas Are the Source of Truth
**What:** Define the document shape once as Zod schemas; derive TS types with `z.infer`. Runtime validation (import boundary, D-14) and static types (all phases) can never disagree.
**When to use:** Any model where a validation boundary exists — D-15 locks it for this phase; Phase 6 workspace import reuses the same envelope machinery (CONTEXT.md Integration Points).
**Example:** See Code Examples — `documentSchema` + `z.infer<typeof documentSchema>`. Zod 4 note: unknown keys are **stripped by default** on `z.object()` (exactly D-14); use `z.strictObject()` only if the boundary must *reject* extras — it does not, here [CITED: zod.dev/api?id=objects].

### Pattern 2: Derived State, Not Stored State
**What:** Totals, watermark, and status-derived facts are pure functions of the model — never persisted fields. The model stores only irreducible user input (line items, discounts, shipping/fees, status) [ARCHITECTURE.md Pattern 2, Anti-Pattern 1].
**When to use:** Aggregations that multiple views render (canvas, PDF, dashboard stats) must agree — the only way is one compute, one function, consumed everywhere.
**Example:** `computeTotals(model)` returns the full totals record (Code Examples). The existing inline copy at `DocumentPage.tsx:27` is deleted; the component imports the engine instead.

### Pattern 3: Versioned Envelope at the Import Boundary
**What:** Exported JSON is `{ format: 'paperchaser-document', version: 1, document }` (D-13). Import validates in three stages — JSON syntax → envelope literals → document schema — each mapping to a distinct rejection code (UI-SPEC E1).
**When to use:** Any user-visible, externally-stored file format (D-13 reversibility note: backups live outside the app). The envelope is the migration seam for future schema evolution.
**Example:** See Code Examples — `parseDocument()` returns `{ ok, document } | { ok: false, error }` with structured reasons; `safeParse` at the boundary, never `parse`-throw.

### Pattern 4: Repos as the Only Persistence Touchpoints
**What:** Thin per-table modules (`documentsRepo.put/get/delete`, `customersRepo.…`) wrapping Dexie; nothing else in the codebase imports `db`. The repos are the seam Phase 4 (auto-save) and Phase 6 (backup/restore) build on.
**When to use:** Local-first apps where IndexedDB is the source of truth; keeps schema access reviewable and swappable (e.g., fake-indexeddb in tests).
**Example:** See Code Examples — `documentsRepo` + the `fake-indexeddb/auto` test setup.

### Anti-Patterns to Avoid
- **Second totals engine in a component:** `DocumentPage.tsx:27` today; after Phase 2, any component that recomputes totals is a regression — grep-enforce `computeTotals` import sites.
- **Persisting computed totals:** storing subtotal/tax/grandTotal in the document object recreates the "out of sync" bug class (ARCHITECTURE.md Anti-Pattern 1).
- **Zod 3 idioms in a Zod 4 project:** `.strict()`, `.passthrough()`, `.flatten()`, `.nonempty()`, `z.string().email()` are deprecated in Zod 4 — use `z.strictObject`/`z.looseObject`/`z.treeifyError`/`z.email()` (top-level) [CITED: zod.dev/v4/changelog].
- **Editing `db.version(1)`:** never alter a shipped version line; `version(2)` adds the real schema (PITFALLS.md:78, Dexie docs: "a version with an upgrader attached must never be altered").

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation at the import boundary | Hand-rolled field checks | Zod 4 (D-15, PRD §7) | Boundary must reject malformed JSON with structured, per-field reasons (STOR-04, UI-SPEC E1); hand-rolled validators drift from the types they claim to check |
| IndexedDB schema/versioning/migrations | Raw IndexedDB or `idb` | Dexie 4.4.4 (installed) | Versioning framework, transaction rollback, auto-open, index syntax; raw IndexedDB is a footgun (STACK.md:107) |
| Money arithmetic | Float math / `.toFixed(2)` / decimal.js | Integer minor units + `roundMinor()` | Float accumulation is the audit-mismatch bug class (PITFALLS.md:232); the seed already stores `unitPriceMinor`/`taxRateMinor` as integers; `quantity × price` is the only float source, rounded once per line (D-01) |
| ID generation | Custom id generators | `crypto.randomUUID()` (native) | IDs must be stable across import/export (ARCHITECTURE.md: uuid, not `++id`); native API, zero dependency |
| Currency formatting (display) | money.js / finance libs | `Intl.NumberFormat` (Phase 3+; not this phase) | Native, locale-aware; STACK.md:122 |

**Key insight:** This phase's entire value is *one* correct computation and *one* validation boundary. Every hand-rolled alternative (inline totals, ad-hoc JSON checks, float math) is the documented failure mode the phase exists to eliminate — the repo already carries one instance of it in `DocumentPage.tsx`.

## Common Pitfalls

### Pitfall 1: Rounding the sum instead of summing the rounded lines
**What goes wrong:** `subtotal = round(Σ qty×price)` instead of `subtotal = Σ round(lineNet)`; tax computed on unrounded nets. The printed per-line amounts no longer reconcile with the totals (D-01/D-03 — the exact bug PITFALLS.md Pitfall 8 documents).
**Why it happens:** The Phase 1 inline engine (DocumentPage.tsx:27-37) does exactly this (`subtotalMinor += net` on raw floats). It survives only because current fixtures have exact integer nets.
**How to avoid:** Implement the exact order in Code Examples; unit fixtures with fractional nets (qty 0.1, tax producing 0.5¢) force the correct path.
**Warning signs:** A unit fixture where `Σ lineNets ≠ subtotalMinor` or `tax ≠ round(roundedNet × rate)`.

### Pitfall 2: Rounding tie-break unspecified — half-up vs half-even
**What goes wrong:** `Math.round(-2.5)` is `-2` (half toward +∞) while invoice convention and `Intl` default `halfExpand` round half *away from zero*; a 0.5-minor-unit tie silently goes the wrong way, and the behavior differs between the engine and any later `Intl.NumberFormat` display.
**Why it happens:** D-01..D-08 lock *when* rounding happens but not the tie-break mode (not covered in the discussion log).
**How to avoid:** Use explicit `roundMinor(x, decimals) = Math.sign(x) * Math.round(Math.abs(x) * 10^d) / 10^d` — half-away-from-zero, matching `Intl`'s `halfExpand` default [CITED: MDN Intl.NumberFormat roundingMode]. Flag to user for confirmation (Open Question 1); cheap to change now, costly after Phase 3 parity fixtures bake exact cents.
**Warning signs:** Any use of bare `Math.round` in money code; fixtures with exactly .5-minor-unit intermediates.

### Pitfall 3: JSON round-trip loss — `undefined` vs `null` vs absent
**What goes wrong:** Export/import of the same document is not lossless: `JSON.stringify` drops `undefined` properties, so an `optional()` model field silently changes representation, and `z.optional` fields that the schema *requires* after import fail.
**Why it happens:** The model seed already mixes `null` (logo) with required fields; new optional fields (discount, shipping fees' tax rate) tempt `optional()` everywhere.
**How to avoid:** Rule: `null` for explicit absence (must appear in JSON), `optional()` only for truly-absent fields (lossless by omission). Recommend shipping/fee `taxRateMinor` be **required** with `0` = untaxed (D-07's "optional tax rate" means "may be 0"), so round-trip is structural, not value-luck. Enforce with a round-trip fixture: `parseDocument(exportDocument(doc))` deep-equals `doc` for every fixture.
**Warning signs:** Any field declared `optional()` that is semantically meaningful; a round-trip unit test that fails on deep-equality.

### Pitfall 4: Zod 4 API drift (Zod 3 muscle memory)
**What goes wrong:** Executor writes `.strict()`/`.passthrough()`/`.flatten()`/`z.string().email()`; deprecation warnings pile up, and `.strict()` on the document schema would REJECT unknown keys — violating D-14's "strips unknowns".
**Why it happens:** The vast majority of Zod tutorials/examples are Zod 3.
**How to avoid:** Research this phase locks the API: `z.object()` (default strip) for the document, `z.enum` with `as const`, top-level `z.email()`/`z.uuid()`/`z.iso.date()`, `z.int()`, `.refine()` for cross-field checks, `z.treeifyError()`/`z.flattenError()` for error shaping [CITED: zod.dev/api, /error-formatting, /v4/changelog].
**Warning signs:** `import { z } from 'zod/v3'` or any `.strict()`/`.flatten()` in new code.

### Pitfall 5: Dexie schema drift and index mistakes
**What goes wrong:** Editing `version(1).stores({})` in place; indexing booleans/null (silently inert); indexing large strings/blobs; omitting an index in v2 that Phase 4+ dashboard queries need → a forced later migration (PITFALLS.md:78-79).
**Why it happens:** Versioning discipline is "start with the first schema commit" — this IS that commit.
**How to avoid:** Keep `version(1)` line untouched; `version(2)` declares the five tables with the indexes Phase 3-6 are known to query (`documents: 'id, type, status, updatedAt'`, `customers/catalog: 'id, name'`); index only `where()`-queried properties (Dexie rule); no booleans in schemas (status is a string) [CITED: dexie.org/docs/Version/Version.stores(), /docs/Tutorial/Design].
**Warning signs:** Schema string contains a boolean property; `version(1)` modified; a table declared without its intended future index.

### Pitfall 6: Reload-survival test accidentally proves nothing
**What goes wrong:** A Playwright reload test that opens a fresh context per test (IndexedDB wiped by design) or that asserts against the app bundle which doesn't import `db.ts` today — green test, zero coverage.
**Why it happens:** Playwright's default `browser.newContext()` gives clean storage per context; and the app entry does not import `src/db/db.ts` (verified this session), so the built bundle has no Dexie to drive.
**How to avoid:** Single context, `page.reload()` between write and read (same-context reload retains IndexedDB — the browser platform guarantee); inject the UMD build `node_modules/dexie/dist/dexie.js` via `page.addScriptTag({ path })` so `window.Dexie` is available in `page.evaluate`; duplicate the schema string with a "must match src/db/db.ts" comment (Code Examples).
**Warning signs:** `browser.newContext()` inside the spec; `page.goto` followed by immediate read without an intervening write+reload.

### Pitfall 7: Breaking the Phase 1 parity contract
**What goes wrong:** The model restructure (watermark → status, type union, new fields) breaks `DocumentPage.tsx` compile or shifts rendered totals, and the committed golden baselines (`tests/fixtures/*.png`) start failing in CI — Phase 2 is zero-UI but must not regress the Phase 1 gate.
**Why it happens:** `fixtures.ts` and the renderer consume `DocumentModel`; `watermark` disappears from the model.
**How to avoid:** (1) Keep exported type names identical; (2) replace `model.watermark` reads with `deriveWatermark(model.status)`; (3) the engine swap is baseline-neutral for the two fixtures (verified: all fixture nets are exact integers — no rounding deltas), but the plan must still run `pnpm test` (parity) at wave end; (4) run `pnpm lint && pnpm typecheck` after the types.ts restructure.
**Warning signs:** `tsc -b` errors in `fixtures.ts`/`DocumentPage.tsx` after the model change; parity diff fraction > calibrated thresholds.

## Code Examples

Verified patterns from official sources, adapted to this project's locked decisions. All examples are skeletons the planner turns into tasks — the executor writes the final code test-first.

### The Totals Engine (exact per-line order per D-01..D-08)

```typescript
// src/document/money.ts — pure; no React/DOM/Dexie
/** Currency → decimal places. D-12: EUR 2dp, JPY 0dp. Registry entries, not model changes. */
export const CURRENCY_DECIMALS: Readonly<Record<string, number>> = { EUR: 2, JPY: 0 }

/** Round half away from zero to `decimals` places — matches Intl.NumberFormat's default halfExpand [CITED: MDN]. */
export function roundMinor(value: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.sign(value) * Math.round(Math.abs(value) * f) / f
}

// src/document/totals.ts
import { CURRENCY_DECIMALS, roundMinor } from './money'

export interface Discount { kind: 'percent' | 'amount'; value: number } // D-06: percent (in % minor units, 1900=19%) or flat minor units
export interface ShippingFee { label: string; amountMinor: number; taxRateMinor: number } // D-07/D-08; taxRateMinor 0 = untaxed
export interface Totals {
  lineNets: number[]                            // per-line rounded nets (reconciliation: printed line == engine line)
  subtotalMinor: number                         // D-01: Σ rounded line nets
  discountMinor: number                         // document-level discount (D-05); line discounts are inside lineNets
  discountedSubtotalMinor: number
  shippingFeesMinor: number                     // Σ shipping/fee amounts (before tax) — uniform treatment (D-07);
                                                // per-entry labels live in the model for the Phase 3 renderer to split
  taxByRate: Array<{ rateMinor: number; taxMinor: number }> // D-04: grouped by rate
  taxMinor: number
  grandTotalMinor: number
}

export function computeTotals(doc: {
  currency: string
  lineItems: Array<{ quantity: number; unitPriceMinor: number; taxRateMinor: number; discount?: Discount }>
  discount?: Discount
  shippingFees?: ShippingFee[]
}): Totals {
  const decimals = CURRENCY_DECIMALS[doc.currency] ?? 2
  const lineNets = doc.lineItems.map((item) => {
    const gross = item.quantity * item.unitPriceMinor                    // only float source — round per line (D-01)
    const lineDiscount = item.discount
      ? item.discount.kind === 'percent' ? (gross * item.discount.value) / 10000 : item.discount.value
      : 0
    return roundMinor(gross - lineDiscount, decimals)                    // once per line, never cascades
  })
  const subtotalMinor = lineNets.reduce((a, b) => a + b, 0)
  const discountMinor = doc.discount
    ? doc.discount.kind === 'percent' ? roundMinor((subtotalMinor * doc.discount.value) / 10000, decimals) : doc.discount.value
    : 0
  const discountedSubtotalMinor = subtotalMinor - discountMinor

  const taxByRate = new Map<number, number>()                            // D-04: grouped by rate
  const addTax = (net: number, rateMinor: number) => {
    if (rateMinor === 0) return
    const t = roundMinor((net * rateMinor) / 10000, decimals)            // D-03: tax on the ROUNDED net
    taxByRate.set(rateMinor, (taxByRate.get(rateMinor) ?? 0) + t)
  }
  doc.lineItems.forEach((item, i) => addTax(lineNets[i], item.taxRateMinor))
  // D-07: shipping/fees are line-like entries — the engine sums them uniformly
  // (amount + optional tax folded into taxByRate). Per-entry labels stay in the
  // model; splitting "Shipping" vs "Fees" display rows is a Phase 3 render concern.
  const shippingFees = doc.shippingFees ?? []
  const shippingFeesMinor = shippingFees.reduce((a, sf) => a + sf.amountMinor, 0)
  shippingFees.forEach((sf) => addTax(sf.amountMinor, sf.taxRateMinor))

  const taxMinor = [...taxByRate.values()].reduce((a, b) => a + b, 0)
  return {
    lineNets, subtotalMinor, discountMinor, discountedSubtotalMinor,
    shippingFeesMinor,
    taxByRate: [...taxByRate.entries()].map(([rateMinor, taxMinor]) => ({ rateMinor, taxMinor })),
    taxMinor,
    grandTotalMinor: discountedSubtotalMinor + taxMinor + shippingFeesMinor,
  }
}

export function deriveWatermark(status: 'draft' | 'sent' | 'paid'): 'draft' | null {
  return status === 'draft' ? 'draft' : null // D-11: watermark derives from status
}
```

> **Planner note:** the engine treats shipping and fees uniformly (D-07) — a single `shippingFeesMinor` total plus per-entry labels in the model; the "Shipping" vs "Fees" display split belongs to the Phase 3 renderer (PRD §6.7 lists both as totals rows).

### Zod 4 Document Schema + Envelope Boundary

```typescript
// src/document/types.ts — RESTRUCTURED schema-first (D-15)
import * as z from 'zod'
import { CURRENCY_DECIMALS } from './money'

const discountSchema = z.object({ kind: z.enum(['percent', 'amount']), value: z.number().nonnegative() })
const shippingFeeSchema = z.object({ label: z.string(), amountMinor: z.int().nonnegative(), taxRateMinor: z.int().nonnegative() })
const lineItemSchema = z.object({
  id: z.string(), title: z.string(), description: z.string(),
  quantity: z.number().nonnegative(),
  unitPriceMinor: z.int().nonnegative(),
  taxRateMinor: z.int().nonnegative(),            // 1900 = 19.00%
  discount: discountSchema.optional(),            // D-06 — absent = no discount
})
const companySchema = z.object({ name: z.string(), address: z.array(z.string()), email: z.string(), logo: z.string().nullable() })
const customerSchema = z.object({ name: z.string(), address: z.array(z.string()) })

export const documentSchema = z.object({          // z.object() default STRIPS unknown keys = D-14
  id: z.string(),
  type: z.enum(['invoice', 'quote', 'receipt']),  // D-09
  currency: z.enum(Object.keys(CURRENCY_DECIMALS) as [string, ...string[]]), // D-12
  issueDate: z.iso.date(),                        // Zod 4 top-level format
  number: z.string(),
  status: z.enum(['draft', 'sent', 'paid']),      // D-11
  company: companySchema,
  customer: customerSchema,
  lineItems: z.array(lineItemSchema),
  discount: discountSchema.optional(),            // D-05 document-level
  shippingFees: z.array(shippingFeeSchema).optional(), // D-08
})
export type DocumentModel = z.infer<typeof documentSchema> // keeps the Phase 1 exported name
// Re-export the nested shapes so fixtures.ts imports keep compiling:
export type LineItem = z.infer<typeof lineItemSchema>
export type Company = z.infer<typeof companySchema>
export type Customer = z.infer<typeof customerSchema>

// src/document/io.ts — envelope boundary (D-13, D-14)
const envelopeSchema = z.object({
  format: z.literal('paperchaser-document'),
  version: z.literal(1),
  document: documentSchema,
})

export type ImportError =
  | { code: 'invalid_json' }
  | { code: 'invalid_envelope'; path?: (string | number)[]; expected?: string; received?: string }
  | { code: 'schema_mismatch'; path: (string | number)[]; expected?: string; received?: string; keys?: string[] }

export function exportDocument(doc: DocumentModel): string {
  documentSchema.parse(doc)                        // fail loudly in dev — never export an invalid doc
  return JSON.stringify({ format: 'paperchaser-document', version: 1, document: doc })
}

export function parseDocument(json: string): { ok: true; document: DocumentModel } | { ok: false; error: ImportError } {
  let raw: unknown
  try { raw = JSON.parse(json) } catch { return { ok: false, error: { code: 'invalid_json' } } }
  const env = envelopeSchema.safeParse(raw)        // z.safeParse at the boundary — never parse-throw
  if (!env.success) {
    const first = env.error.issues[0]              // Zod 4 issue shape: { code, path, message, expected?, received?, keys? }
    return { ok: false, error: first.code === 'unrecognized_keys'
      ? { code: 'invalid_envelope', path: first.path, keys: first.keys }
      : { code: 'schema_mismatch', path: first.path, expected: first.expected, received: first.received } }
  }
  return { ok: true, document: env.data.document }
}
```

> Zod 4 issue structure verified from official docs: `invalid_type` issues carry `{ expected, received, path, message }`; strict-mode unknown keys produce `{ code: 'unrecognized_keys', keys, path }` [CITED: zod.dev/error-formatting]. With D-14's strip behavior the document schema uses default `z.object()`, so `unrecognized_keys` should not occur at the document level — it is only reachable at the envelope level if the envelope were `strictObject` (it is not); the mapper above is defensive.

### Dexie version(2) + Repos

```typescript
// src/db/db.ts — EXTENDED; version(1) line untouched (PITFALLS.md:78, Dexie versioning rules)
import Dexie from 'dexie'

export const db = new Dexie('paperchaser')
db.version(1).stores({})                    // NEVER alter — shipped in Phase 1

// STOR-02: five stores. id-keyed (not ++id) for import/export ID stability.
// Index only where()-queried properties (Dexie rule); status is a string (indexable).
db.version(2).stores({
  company: 'id',                             // singleton profile
  customers: 'id, name',                     // name index → Phase 5 search
  catalog: 'id, name',                       // product catalog; name index → Phase 5 search
  documents: 'id, type, status, updatedAt',  // Phase 6 dashboard: stats by status, recent by updatedAt
  preferences: 'key',                        // KV
})

// src/db/repos.ts
export const documentsRepo = {
  put: (doc: DocumentModel) => db.documents.put(doc),
  get: (id: string) => db.documents.get(id),
  delete: (id: string) => db.documents.delete(id),
  byStatus: (status: DocumentModel['status']) => db.documents.where('status').equals(status).toArray(),
}
// companyRepo (singleton get/put), customersRepo, catalogRepo, preferencesRepo follow the same shape.
```

### Vitest Unit Tests (colocated, node env, explicit imports)

```typescript
// src/document/__tests__/totals.test.ts
import { describe, expect, it } from 'vitest'
import { computeTotals } from '../totals'

describe('computeTotals — per-line rounding (D-01/D-03)', () => {
  it('sums rounded line nets, not raw nets', () => {
    // qty 0.1 × 1000¢ = 100¢ exact; qty 1 × 125¢ = 125¢ — use a fractional-net case to force per-line rounding
    const totals = computeTotals({ currency: 'EUR', lineItems: [{ id: 'a', title: 't', description: '', quantity: 0.1, unitPriceMinor: 1000, taxRateMinor: 1900 }] })
    expect(totals.subtotalMinor).toBe(100)
    expect(totals.grandTotalMinor).toBe(119) // 100 × 19% = 19¢
  })
  it('JPY 0dp: rounding to whole yen (D-12)', () => {
    const totals = computeTotals({ currency: 'JPY', lineItems: [{ id: 'a', title: 't', description: '', quantity: 3, unitPriceMinor: 12345, taxRateMinor: 1000 }] })
    expect(totals.subtotalMinor).toBe(37035) // exact — add a 0.5 tie case in the real suite
  })
})

// src/db/__tests__/documentsRepo.test.ts — fake-indexeddb (README-documented Dexie pairing)
import 'fake-indexeddb/auto'
import { describe, expect, it, beforeEach } from 'vitest'
import { db } from '../db'
import { documentsRepo } from '../repos'

beforeEach(async () => { await db.delete(); await db.open() }) // fresh fake DB per test
// ... put/get/delete round-trip tests
```

### Playwright Reload-Survival Spec (STOR-01/02)

```typescript
// tests/persistence.spec.ts
import { test, expect } from '@playwright/test'

// Schema string MUST match src/db/db.ts version(2) — update both together.
const SCHEMA = {
  company: 'id', customers: 'id, name', catalog: 'id, name',
  documents: 'id, type, status, updatedAt', preferences: 'key',
}
const DOC = { id: 'persist-1', type: 'invoice', currency: 'EUR', issueDate: '2026-08-07',
  number: 'RE-2026-0999', status: 'draft',
  company: { name: 'Test GmbH', address: ['Testweg 1'], email: 't@test.test', logo: null },
  customer: { name: 'Test Kundin', address: ['Weg 9'] },
  lineItems: [{ id: 'l1', title: 'Beratung', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 }] }

test('document written via Dexie survives a full page reload', async ({ page }) => {
  await page.goto('/')
  await page.addScriptTag({ path: 'node_modules/dexie/dist/dexie.js' }) // UMD → window.Dexie
  await page.evaluate(async ({ SCHEMA, DOC }) => {
    const db = new window.Dexie('paperchaser')
    db.version(2).stores(SCHEMA)
    await db.documents.put(DOC)
  }, { SCHEMA, DOC })
  await page.reload() // SAME context — IndexedDB is retained across reloads
  const stored = await page.evaluate(async (id) => {
    const db = new window.Dexie('paperchaser')
    db.version(2).stores({ documents: 'id, type, status, updatedAt' })
    return db.documents.get(id)
  }, DOC.id)
  expect(stored).toEqual(DOC)
})
```

> **Drift guard:** the duplicated schema strings are the documented cost of a zero-UI phase (the app bundle does not import `db.ts`). Alternative rejected: exporting the schema map from `db.ts` and importing it in the browser — the preview server does not serve `/src/*` modules. Keep the comment; the Vitest repo tests (real `db.ts` schema via fake-indexeddb) are the authoritative schema check, this spec proves the browser-platform claim.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zod 3 `.strict()`/`.passthrough()`/`.flatten()`/`.format()` | Zod 4 `z.strictObject()`/`z.looseObject()`/`z.treeifyError()`/`z.prettifyError()`; `z.object()` strips by default | Zod 4 stable (2025); v4.4.3 current 2026-05 | Deprecated forms still work but warn; new code must use the Zod 4 API — the envelope mapper in this research uses the current issue shape `{ code, path, expected, received, keys }` [CITED: zod.dev/v4/changelog + /error-formatting] |
| Zod 3 `z.string().email()`/`.uuid()`/`.regex(date)` | Zod 4 top-level formats `z.email()`, `z.uuid()`, `z.iso.date()` | Zod 4 | Simpler, stricter date validation for `issueDate` (YYYY-MM-DD enforced) [CITED: zod.dev/api] |
| Vitest 3.x | Vitest 4.1.10 (peer `vite ^6||^7||^8`) | 2025-2026 | First Vitest release line compatible with Vite 8; requires Node ≥20 (we have 24) [VERIFIED: npm registry] |
| Dexie 3 schema-diff vs declared versions | Dexie ≥3 diffs against the *installed* schema | Dexie 3.0 (2021) | Phase 2 keeps v1 line and adds v2; future migrations only need changed tables [CITED: dexie.org/docs/Tutorial/Design] |
| Money as floats / `.toFixed(2)` | Integer minor units + explicit half-away-from-zero rounding | Locked in this project (seed model + D-01) | No decimal library; single `roundMinor` in the domain core [CITED: MDN Intl roundingMode] |

**Deprecated/outdated:**
- **Zod 3 idioms** (`.strict`, `.passthrough`, `.strip`, `.flatten`, `.format`, `.nonempty`, `z.string().email()`): deprecated in Zod 4 — the research examples use the current API [CITED: zod.dev/v4/changelog].
- **`z.promise()`**: deprecated in Zod 4 — irrelevant here (synchronous boundary).
- **Hand-rolled per-component totals** (DocumentPage.tsx:27): the deprecated pattern this phase removes — ARCHITECTURE.md Anti-Pattern 1.

## Assumptions Log

> All claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this to identify decisions needing user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Rounding tie-break is **half-away-from-zero** (`Math.sign(x) * Math.round(Math.abs(x))`), matching `Intl` default `halfExpand`. D-01..D-08 lock *when* rounding happens but not the tie mode — the discussion log does not record it either. | Code Examples (money.ts), Open Question 1 | LOW-MEDIUM: a .5-minor-unit tie goes the "wrong" way vs half-even; changes exact cents on edge fixtures. Cheap to change in Phase 2, costly after Phase 3 bakes parity baselines. **Needs user confirmation.** |
| A2 | Dexie table names: `company`, `customers`, `catalog`, `documents`, `preferences` — following CONTEXT.md's five-store naming ("company profile, customers, product catalog, documents, preferences"). ARCHITECTURE.md earlier proposed `companyProfiles`/`products`. | Architecture Patterns, Code Examples | LOW: renaming before Phase 3 is a one-line schema change + repo rename; after Phase 3, a v3 migration. |
| A3 | Import boundary adds an `invalid_json` rejection code beyond the two named in UI-SPEC E1 (`invalid_envelope`, `schema_mismatch`) — `JSON.parse` failure must be representable. | Code Examples (io.ts) | LOW: the E1 contract lists two codes; a third is additive and cannot break the contract (it names the envelope/schema classes, not an exhaustive union). Confirm with the UI-SPEC checker at plan review. |
| A4 | `currency` is `z.enum(Object.keys(CURRENCY_DECIMALS))` (EUR/JPY), so adding a currency is a registry + schema change (envelope version bump). D-12 says "additional currencies are registry entries, not model changes" — the enum makes the schema change explicit rather than silently accepting arbitrary codes. | Code Examples (types.ts) | LOW: contradicts a literal reading of D-12 ("not model changes"); MONEY-01 (v2) will widen the enum. A free-string `z.string().regex(/^[A-Z]{3}$/)` + runtime registry lookup is the alternative. |
| A5 | `status` enum is exactly `'draft' | 'sent' | 'paid'` for all three types; receipts default to `'paid'` (D-11 "e.g." wording). No `'void'`/`'accepted'`/`'overdue'` states in v1. | Code Examples (types.ts) | LOW-MEDIUM: D-11 uses "e.g." — a fourth state (e.g. `'void'`) would be a schema + migration change later. **Worth a 10-second user confirm.** |
| A6 | Document-level discount is a **single** instance (`discount: Discount | undefined`), not an array — D-05 says "a document-level discount" (singular) while D-08 explicitly makes shipping/fees an array. Line discounts are per-line single instances. | Code Examples (types.ts) | LOW: if multiple doc-level discounts are wanted later, it's a schema change; v1 renders one discount line (PRD §6.7 totals list has one "Discount"). |
| A7 | The displayed "Discount" total = document-level discount only; per-line discounts are folded into the line nets / subtotal (D-05's subtotal is "after all line discounts"). | Code Examples (totals.ts) | LOW: alternative layouts show Σ per-line discounts separately; the model retains per-line discount values so a renderer could show them — Phase 3 concern. |
| A8 | Shipping/fee entries carry **required** `taxRateMinor` (0 = untaxed), not `optional()` — "optional tax rate" (D-07) means "may be 0"; required-0 keeps JSON round-trip structural (Pitfall 3). | Code Examples (types.ts) | LOW: if the user literally wants the field absent for untaxed entries, the schema is `z.number().optional().default(0)` — a one-line change; round-trip still works via default. |
| A9 | Vitest unit tests are colocated under `src/**/__tests__/*.test.ts` — typechecked by `tsc -b` (CI typecheck covers tests), never bundled by `vite build` (build follows the entry graph only). | Standard Stack, Validation Architecture | LOW: alternative is a `tests/unit/` dir + extra tsconfig; colocation matches the "domain core is Node-testable" contract with zero config. |

## Open Questions (RESOLVED)

> All three questions were resolved at plan review. The adopted answers are pinned by the plan fixtures listed per question; the Assumptions Log entries A1/A5/A6 are no longer open.

1. **Rounding tie-break mode (half-away-from-zero vs half-even)? — (RESOLVED: half-away-from-zero)**
   - Adopted answer: **half-away-from-zero** — `roundMinor(value, decimals) = Math.sign(value) * Math.round(Math.abs(value) * 10^d) / 10^d`, matching `Intl.NumberFormat`'s default `halfExpand` so Phase 3 display never disagrees with the engine (A1).
   - Pinned by: plan 02-02, task 2 — a negative .5-minor-unit tie fixture in `src/document/__tests__/totals.test.ts` asserting `roundMinor(-2.5)` yields -3 (away from zero), not `Math.round`'s half-toward-+∞.
   - Rationale: D-01..D-08 lock *when* rounding happens, not the tie mode (discussion log records no choice); half-away-from-zero matches invoice practice and the `Intl` default. Cheap to change now, costly after Phase 3 parity baselines bake exact cents.

2. **Status enum — exactly `'draft' | 'sent' | 'paid'`, receipts default `'paid'`? — (RESOLVED: three-value enum)**
   - Adopted answer: `status: z.enum(['draft', 'sent', 'paid'])` for all three types; receipts default `'paid'` (A5). No `'void'`/`'accepted'`/`'declined'` states in v1 — adding one later is a schema + migration change.
   - Pinned by: plan 02-02 — the `documentSchema` status enum in `src/document/types.ts` plus `deriveWatermark(status)` fixtures in `src/document/__tests__/totals.test.ts` (draft→'draft', sent/paid→null, D-11).
   - Rationale: D-11's "e.g." wording left the breadth open; CONV-01 (quote→invoice conversion, v2) may motivate `'accepted'` later, but nothing in this phase needs it.

3. **Document-level discount: single or multiple instances? — (RESOLVED: single instance)**
   - Adopted answer: **single** document-level discount instance (`discount: discountSchema.optional()`, one per document) (A6); line discounts remain per-line single instances; shipping/fees stay an array (D-08).
   - Pinned by: plan 02-02 — the `documentSchema` discount field in `src/document/types.ts` plus task 3 discount fixtures in `src/document/__tests__/totals.test.ts` (one document-level discount applied to the subtotal).
   - Rationale: D-05 says "a document-level discount" (singular) and PRD §6.7 totals list has one "Discount" line; growing to an array later needs no Dexie migration (non-indexed field) — only the Zod schema and UI change.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8 / Vitest 4 / Dexie runtime | ✓ | v24.12.0 | — (satisfies Vitest's Node ≥20) |
| pnpm | Install/lockfile | ✓ | 11.20.0 | — |
| Playwright Chromium | reload-survival spec + parity | ✓ | chromium-1234 + headless_shell (installed in `~/.cache/ms-playwright`) | — |
| zod | import/export boundary (D-15) | ✗ | — | install `pnpm add zod` (Wave 0) |
| vitest | unit-test framework | ✗ | — | install `pnpm add -D vitest` (Wave 0) |
| fake-indexeddb | repo unit tests | ✗ | — | install `pnpm add -D fake-indexeddb` (Wave 0) |
| IndexedDB (real) | reload-survival spec | ✓ (browser) | — | fake-indexeddb covers unit level only — the browser-platform reload claim needs the real one in Playwright |

**Missing dependencies with no fallback:** none — the three packages to install (zod, vitest, fake-indexeddb) are all on the approved legitimacy list and have no platform prerequisites.

**Missing dependencies with fallback:** none beyond the Wave 0 installs above.

## Runtime State Inventory

> Included because Phase 2 restructures the Phase 1 model (`types.ts`, `fixtures.ts`, `DocumentPage.tsx`) and the persistence stub (`db.ts`) — the canonical "after every file is updated, what still carries the old shape?" audit.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — the `paperchaser` IndexedDB has an **empty v1 schema** (`version(1).stores({})` — CONTEXT.md:65 "empty by design"); no user data exists anywhere (Phase 1 shipped no persistence writes) | None — v2 schema is the first real schema; no migration of live data |
| Live service config | None — no services, no external config surfaces (repo is a static SPA; CI-only GitHub Actions, unchanged) | None |
| OS-registered state | None — no daemons, schedulers, or OS registrations reference paperchaser | None |
| Secrets/env vars | None — no env vars, keys, or secrets exist (local-first, no backend) | None |
| Build artifacts | `dist/` (gitignored) — rebuilt by CI/`pnpm build`; **committed golden parity baselines** `tests/fixtures/*.png` are the one artifact the model change can affect | Engine swap is baseline-neutral for the two fixtures (all line nets exact integers — verified from fixture arithmetic); run `pnpm test` (parity) at wave end to confirm; regenerate via `pnpm test:update` ONLY if a fixture's totals actually change (reviewed, never CI-automated — PITFALLS.md:5, CI comment) |

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — this section is required. This phase adds the **unit-test layer** the repo lacks; the Playwright parity harness (Phase 1) stays the render/PDF gate.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 (unit, node env) + @playwright/test 1.62.1 (persistence e2e) + existing parity harness |
| Config file | none for Vitest — reads `vite.config.ts` by default (zero config, documented behavior); `playwright.config.ts` unchanged |
| Quick run command | `pnpm test:unit` (new script: `vitest run`) |
| Full suite command | `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test` |
| CI | add `pnpm test:unit` step to `.github/workflows/ci.yml` after `pnpm typecheck` (or after build — order per planner); `pnpm install --frozen-lockfile` covers new deps |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LINE-03 | Totals computed by one engine; per-line rounding; both discount levels; shipping/fees; EUR 2dp + JPY 0dp fixtures; 0.1-quantity and .5-tie cases; `Σ lineNets == subtotal`; `tax == round(roundedNet × rate)` | unit | `pnpm exec vitest run src/document/__tests__/totals.test.ts` | ❌ Wave 0 |
| LINE-03 | Renderer consumes the engine (no second `computeTotals`); watermark derived from status | unit/integration | `pnpm typecheck` + `pnpm test` (parity still green after `DocumentPage.tsx` swap) | ❌ Wave 0 (edit) |
| STOR-01 | Repos persist via Dexie (fake-indexeddb): put/get/delete round-trips; singleton company; KV preferences | unit | `pnpm exec vitest run src/db/__tests__/repos.test.ts` | ❌ Wave 0 |
| STOR-01/02 | Data survives a full page reload in a real browser | e2e (Playwright) | `pnpm exec playwright test tests/persistence.spec.ts` | ❌ Wave 0 |
| STOR-03 | `exportDocument` emits the envelope shape; `parseDocument(exportDocument(doc))` deep-equals `doc` for all fixtures (lossless round-trip) | unit | `pnpm exec vitest run src/document/__tests__/io.test.ts` | ❌ Wave 0 |
| STOR-04 | Boundary rejects: malformed JSON (`invalid_json`), wrong format/version (`invalid_envelope`), missing/typo'd required fields (`schema_mismatch` with path/expected/received); unknown extra fields stripped, not rejected | unit | same `io.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm exec vitest run <touched test file>` + `pnpm typecheck`
- **Per wave merge:** `pnpm lint && pnpm typecheck && pnpm test:unit`
- **Phase gate:** full suite above + `pnpm test` (parity, unchanged gate) green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Framework install: `pnpm add zod && pnpm add -D vitest fake-indexeddb`
- [ ] `package.json`: add `"test:unit": "vitest run"` script (keep `test` = parity)
- [ ] `src/document/__tests__/totals.test.ts` — LINE-03 unit fixtures (per-line rounding, both discount levels, shipping/fees, EUR/JPY, 0.1 qty, .5 ties, reconciliation assertions)
- [ ] `src/document/__tests__/io.test.ts` — STOR-03/04 envelope + boundary + round-trip fixtures
- [ ] `src/db/__tests__/repos.test.ts` — STOR-01/02 repo CRUD on fake-indexeddb
- [ ] `tests/persistence.spec.ts` — STOR-01/02 reload-survival (UMD Dexie pattern above)
- [ ] `.github/workflows/ci.yml` — add `pnpm test:unit` gate
- [ ] Model restructure fixtures: `fixtures.ts` status field + `DocumentPage.tsx` engine swap (keep parity green)

## Security Domain

> `workflow.security_enforcement: true` (ASVS level 1, block on high) — this section is required. Surface: untrusted JSON entering through the import boundary, and the local persistence of PII-bearing document data. No auth, no network, no backend.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No accounts (REQUIREMENTS.md out-of-scope table) |
| V3 Session Management | No | Stateless local SPA |
| V4 Access Control | No | Single-user local app |
| V5 Input Validation | **Yes** | Zod 4 at the import boundary (`parseDocument` — envelope schema + document schema; `safeParse`, structured rejection, unknown keys stripped). This is the phase's primary security control (STOR-04, D-14) |
| V6 Cryptography | No | No secrets, no transmission; data stays in IndexedDB / local files |

### Known Threat Patterns for the Phase 2 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious/backup JSON hydrates garbage or hostile payloads (e.g. `<img onerror>` in a text field) | Tampering | Zod boundary validates shape; React renders text nodes escaped by default (DocumentPage.tsx header comment: raw-HTML injection banned project-wide, grep-enforced in CI); unknown keys stripped (D-14) |
| Imported document with a non-data URL in `logo` (external fetch on render → tracking pixels / SSRF-ish exfiltration) | Information Disclosure | Constrain `logo` to `data:` URLs or null in the schema (seed stores a data-URL SVG; PITFALLS.md:429 logo-by-URL warning). Add a `z.refine`/regex check at the schema level in this phase |
| PII (names, addresses, bank details) sitting in exported JSON files | Information Disclosure | v1: local-only export, documented in the compliance checklist (COMPL-02 guidance) and Phase 6 backup UX warning (PITFALLS.md:431); out of Phase 2's scope beyond keeping synthetic fixtures synthetic |
| Imported document exceeding reasonable size (memory/parse cost) | DoS | Optional `z.string().max()` bounds and/or a JSON payload size cap at the boundary — cheap to add in this phase; flag for planner (not required by any decision) |

## Sources

### Primary (HIGH confidence)
- **npm registry** (`npm view <pkg> version` + `peerDependencies`), fetched 2026-08-07 — zod 4.4.3, vitest 4.1.10 (peer `vite ^6||^7||^8`), fake-indexeddb 6.2.5, dexie 4.4.4 [VERIFIED: npm registry]
- **zod.dev official docs** (fetched 2026-08-07): `/api` (z.object strip-by-default, z.strictObject/z.looseObject, z.enum, z.iso.date, z.int), `/error-formatting` (issue shape `{code,path,message,expected?,received?,keys?}`, z.treeifyError/z.prettifyError/z.flattenError), `/v4/changelog` (.strict/.passthrough/.strip/.flatten deprecated; z.promise deprecated) [CITED]
- **dexie.org official docs** (fetched 2026-08-07): `Version.stores()` (schema syntax, indexable types — no booleans/null/undefined, no blobs; primary key first entry), `Tutorial/Design` (versioning diff vs installed schema, never alter upgraders, table:null drops, transactions rw + auto-commit + rollback, Dexie.waitFor, populate event) [CITED]
- **vitest.dev/guide** (fetched 2026-08-07): requires Vite ≥6/Node ≥20, reads `vite.config.ts` by default, `*.test.*`/`*.spec.*` patterns, `vitest run` for CI, explicit imports (globals off default) [CITED]
- **MDN Intl.NumberFormat()** (fetched 2026-08-07): JPY "doesn't use a minor unit" (0dp) vs EUR 2dp; default `roundingMode: halfExpand`; ISO 4217 minor units sourced from the six-group list [CITED]
- **fake-indexeddb README** (via npm registry, fetched 2026-08-07): explicit Dexie pattern — `import 'fake-indexeddb/auto'` before `import Dexie` [CITED]

### Secondary (MEDIUM confidence)
- **In-repo source of truth, read this session:** `src/document/types.ts` (seed model — LineItem/Company/Customer/DocumentModel verbatim), `src/db/db.ts` (v1 empty stub), `src/document/fixtures.ts` (fixture arithmetic verified integer-exact), `src/components/DocumentPage.tsx` (inline computeTotals at :27-37 — the anti-pattern replaced), `src/router.ts`, `tsconfig.app.json`, `playwright.config.ts`, `.oxlintrc.json`, `.github/workflows/ci.yml`, `package.json` [VERIFIED: repo files]
- **Prior project research:** STACK.md (zod 4.4.3 pin, dexie 4.4.4, Vitest "phase-planning decision"), PITFALLS.md (Pitfall 3 Dexie versioning:78, Pitfall 8 money:232, JSON-import security:427-429), ARCHITECTURE.md (derived-state totals, schema-first model, uuid ids, repo seams, build order Phase 2), REQUIREMENTS.md, ROADMAP.md, STATE.md, 02-CONTEXT.md, 02-DISCUSSION-LOG.md, 02-UI-SPEC.md, 01-RESEARCH.md (Phase 1 conventions) — read in full this session [VERIFIED]
- **gsd-tools package-legitimacy check** (2026-08-07) — zod [SUS: unknown-downloads lookup artifact — false positive, see audit table], vitest [OK], dexie [OK], fake-indexeddb [OK]

### Tertiary (LOW confidence)
- The rounding tie-break convention (A1) and status enum breadth (A5) — domain practice, not doc-verified; flagged as Open Questions for user confirmation
- Dexie + Vitest + fake-indexeddb as a CI-safe combo — the pieces are individually doc-verified; the exact combination is standard practice (fake-indexeddb README names Dexie explicitly)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version/peer verified against npm today; Zod 4 API corrections (strictObject, issue shape, deprecated APIs) verified against zod.dev; Vitest 4.1.10 Vite-8 peer confirmed
- Architecture: HIGH — schema-first model, derived totals, envelope boundary, and repo seams all follow locked decisions (D-01..D-15) and the repo's established patterns; the one judgment call (which `DocumentPage.tsx` changes are required to keep parity green) is grounded in a line-by-line read of the component and fixture arithmetic
- Pitfalls: HIGH — Dexie/Zod/Vitest pitfalls verified against official docs; the JSON round-trip and baseline-drift pitfalls verified against the actual model and fixtures
- Domain practice (rounding tie-break, status enum): MEDIUM — flagged as [ASSUMED] (A1/A5) and Open Questions rather than asserted

**Research date:** 2026-08-07
**Valid until:** 2026-09-06 (30 days — fast-moving toolchain: Vitest 4.1.x and Zod 4.4.x release frequently; re-verify at Phase 3 if older than 30 days)



