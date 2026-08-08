---
phase: 02-domain-core-persistence
reviewed: 2026-08-08T10:27:17Z
depth: deep
files_reviewed: 14
files_reviewed_list:
  - package.json
  - .github/workflows/ci.yml
  - src/document/types.ts
  - src/document/money.ts
  - src/document/totals.ts
  - src/document/fixtures.ts
  - src/document/io.ts
  - src/components/DocumentPage.tsx
  - src/db/db.ts
  - src/db/repos.ts
  - src/document/__tests__/totals.test.ts
  - src/document/__tests__/io.test.ts
  - src/db/__tests__/repos.test.ts
  - tests/persistence.spec.ts
findings:
  critical: 0
  warning: 6
  info: 6
  total: 12
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-08-08T10:27:17Z
**Depth:** deep
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Reviewed the Phase 2 domain-core + persistence implementation: schema-first Zod model (types.ts), money/totals engine (money.ts, totals.ts), JSON import/export boundary (io.ts), Dexie schema + repos (db.ts, repos.ts), the renderer swap (DocumentPage.tsx), toolchain/CI (package.json, ci.yml), and the three test suites.

High-level assessment: the code is well-structured and the boundary hardening is genuinely effective — verified at runtime against zod 4.4.3 that (a) `1e999`/Infinity money values are rejected by `z.number()`/`z.int()`, (b) prototype pollution via `__proto__` keys in imported JSON does not occur (`({}).polluted === false` after parse; `z.object()` strip never copies the key), (c) the 5M-char DoS cap works, and (d) deep-nesting stack-overflow throws from `JSON.parse` are caught by the try/catch → `invalid_json`. No BLOCKER-class defects were proven.

The six warnings are all latent (not reachable through the current EUR-only fixture route), but each is a real defect that becomes user-visible the moment the documented consumers arrive (Phase 6 import→render, dashboard, editor): the `updatedAt` index that no model field populates, a renderer that hardcodes EUR formatting despite the new JPY support, a float-boundary rounding deviation in the money engine, a precision gap at the import boundary (fractional discount values), renderer omission of the new discount/shipping fields, and the reload-survival e2e not being wired into CI.

## Warnings

### WR-01: `updatedAt` index declared on `documents` but no model field ever populates it

**File:** `src/db/db.ts:20` (index declaration), `src/db/repos.ts:49-55` (`documentsRepo.put`), `src/document/types.ts:68-87` (model fields)
**Issue:** The version(2) schema indexes `documents: 'id, type, status, updatedAt'`, and the summary states the index serves "Phase 6 dashboard ... recent by updatedAt". But `documentSchema` has no `updatedAt` field and `documentsRepo.put(doc)` stores the `DocumentModel` as-is — every record's `updatedAt` index entry is `undefined`. Any future `.where('updatedAt')` query returns nothing. The drift-guard test (`repos.test.ts:70`) asserts the index exists, locking the useless index in as "correct", and the duplicated SCHEMA in `tests/persistence.spec.ts:11` copies the same drift. The index is declared but structurally unpopulatable — either the model needs an `updatedAt` field (set by the repo on write, e.g. `{...doc, updatedAt: new Date().toISOString()}`), or the index should be dropped until a phase that owns timestamps.
**Fix:** Add `updatedAt` to the persisted row type only (`src/db/repos.ts`): `type DocumentRow = DocumentModel & { updatedAt: string }`, have `documentsRepo.put` stamp `updatedAt: new Date().toISOString()`, and update the `Tables` interface. Alternatively remove `updatedAt` from the index now and add it with the migration that introduces timestamps.

### WR-02: Renderer hardcodes EUR formatting while the model now supports JPY (D-12)

**File:** `src/components/DocumentPage.tsx:15-19` (`const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })` and `formatMinor` dividing by 100), used at lines 93-96, 107, 111, 115
**Issue:** Plan 02-02 shipped JPY as a first-class currency (`CURRENCY_DECIMALS` registry, `currency` enum, JPY fixtures and engine tests). The only renderer formats every minor-unit amount as EUR and unconditionally divides by 100. A JPY document (0dp — whole yen) renders ¥1,500 as "15,00 €" and ¥37,035 as "370,35 €" — wrong currency AND wrong scale. Today no user path creates a JPY doc (the route whitelist serves EUR fixtures only), so this is latent; the moment Phase 6 renders an imported JPY envelope (which `parseDocument` explicitly accepts and round-trips, `io.test.ts:121-152`), every printed amount is wrong. `formatMinor` must take the document currency and decimals: `formatMinor(minor, currency)` using `Intl.NumberFormat(locale, { style: 'currency', currency })` and dividing by `10 ** CURRENCY_DECIMALS[currency]`.
**Fix:**
```ts
function formatMinor(minor: number, currency: keyof typeof CURRENCY_DECIMALS): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(
    minor / 10 ** CURRENCY_DECIMALS[currency],
  )
}
```
Pass `model.currency` at all five call sites. Add a JPY render fixture so parity baselines cover it.

### WR-03: `roundMinor` float-multiply hazard violates the documented half-away-from-zero policy on real fractional quantities

**File:** `src/document/money.ts:17-19`, applied at `src/document/totals.ts:47-53` (per-line net)
**Issue:** `roundMinor` multiplies in float space (`Math.abs(value) * f`). When `quantity × unitPriceMinor` is mathematically a `.5` boundary, the double product can land a hair below it and round the wrong way. Concrete repro against the shipped engine: `quantity: 0.7, unitPriceMinor: 45` (JPY, 0dp) → product `31.499999999999996` → `roundMinor` yields **31**, but half-away-from-zero (and `Intl`, which the docstring claims to match) yields **32**. Brute-force scan over q ∈ [0.1..9.9], p ∈ [1..500] found this class of error at q=0.7 with p ∈ {45, 85, 165, 175, 325, 335, ...}. The committed fixtures only pin binary-exact cases (0.5, 0.1×1000, 211×0.5), so the suite cannot catch it. Every such line is off by 1 minor unit.
**Fix:** Two options: (1) document the limitation explicitly in `roundMinor` and add a boundary fixture (e.g. qty 0.7 × 45 JPY) pinning the actual behavior so the deviation is at least known; (2) mitigate by scaling the quantity to integer minor units before the multiply is impossible (quantity is the one float), so the practical fix is acknowledging the ±1-minor-unit corner in PITFALLS.md and pinning it in a test rather than claiming exact Intl parity.

### WR-04: `discount.value` is not `z.int()` — fractional discounts pass the import boundary, breaking the integer-minor-unit hardening claim

**File:** `src/document/types.ts:17-20` (`discountSchema.value: z.number().nonnegative()`)
**Issue:** Plan 02-04's hardening deliverable is "integer-minor-unit precision enforcement" and io.ts rejects fractional `unitPriceMinor`/`amountMinor`/`taxRateMinor` via `z.int()`. But `discount.value` (used for both percent and flat-amount discounts, in minor units) is plain `z.number()`, so a JSON import with `"discount": { "kind": "amount", "value": 100.5 }` is accepted (`verified: z.number().safeParse(100.5).success === true`) and `computeTotals` then emits fractional minor units (`discountMinor: 100.5`, fractional `grandTotalMinor`) — exactly the precision failure the boundary was built to prevent. Percent discounts with fractional values (e.g. `1900.5` = 19.005%) are equally accepted.
**Fix:** `value: z.int().nonnegative()` in `discountSchema` (both kinds are integer minor units by definition — D-06). Add a boundary test mirroring the `unitPriceMinor: 100.5` fixture for `discount.value`.

### WR-05: Renderer omits the discount/shipping fields the engine now computes — printed totals don't reconcile with visible rows

**File:** `src/components/DocumentPage.tsx:104-117` (totals section shows only Zwischensumme/Steuern/Gesamtsumme), `:60` (header hardcodes "Rechnung")
**Issue:** Plan 02-02 added document-level discounts (D-05) and shipping/fees (D-07/D-08) to the model and the engine, but the renderer displays neither. Consequences for any document carrying these fields (reachable today via the import boundary, rendered in Phase 6): (1) a document-level discount makes `grandTotalMinor <` the visible line sum with no discount row explaining the gap — an invoice that looks arithmetically wrong; (2) shipping/fee amounts are folded into the grand total but invisible; (3) `model.type` can be `quote`/`receipt` (D-09) yet the heading always prints "Rechnung". The totals engine's `discountMinor`, `discountedSubtotalMinor`, `shippingFeesMinor`, and `taxByRate` outputs (totals.ts:27-37) are all dead in the renderer.
**Fix:** Render the missing rows in the totals section: a discount line (`discountMinor`, negative), a shipping/fees line, and the per-rate tax breakdown from `taxByRate`; derive the heading from `model.type` (or add a `headingFor(type)` domain helper). Add a fixture with a document-level discount + shipping to parity so the printed output is pinned.

### WR-06: Reload-survival e2e (`tests/persistence.spec.ts`) is not part of CI — the STOR-01/02 proof can rot undetected

**File:** `package.json:12` (`"test": "playwright test tests/parity.spec.ts"`), `.github/workflows/ci.yml:23` (`pnpm test` runs parity only)
**Issue:** The plan's STOR-01/02 evidence is the real-Chromium reload-survival spec, but nothing in CI ever executes it — `pnpm test` scopes to `tests/parity.spec.ts` and no CI step references `persistence.spec.ts`. The spec's duplicated `SCHEMA` constant carries only a comment-level "MUST match src/db/db.ts" guard, so a future schema change that drifts the spec from `db.ts` (e.g. removing/renaming a table) is caught by nothing in the pipeline. The summary's own self-check ran the spec manually; the gate is not automated.
**Fix:** Add a CI step, e.g. `- run: pnpm exec playwright test tests/persistence.spec.ts` after `pnpm test`, or broaden the `test` script to `playwright test tests/parity.spec.ts tests/persistence.spec.ts`. Consider asserting the SCHEMA constant against the real `db.ts` string in the Vitest drift-guard so the duplication is enforced, not commented.

## Info

### IN-01: Explicit `null` for optional fields is rejected (`.optional()` accepts only `undefined`)

**File:** `src/document/types.ts:42, 86`
**Issue:** `discount: discountSchema.optional()` and `shippingFees: ... .optional()` — Zod 4 `.optional()` rejects `null` (verified: `safeParse({discount: null}).success === false`). Hand-authored or third-party JSON that uses the common JSON convention `"discount": null` (null = absent) is rejected with `schema_mismatch` at `['document','discount']`, even though the envelope's own `JSON.stringify` drops absent keys. Intentional strictness is defensible; if interop matters, use `.nullable().optional()`.
**Fix:** If null-as-absent interop is desired: `discount: discountSchema.nullable().optional()` (same for `shippingFees`), with a test.

### IN-02: `parsed.error.issues[0]` is dereferenced without a guard

**File:** `src/document/io.ts:68-75`
**Issue:** The mapper reads `issues[0]` and immediately accesses `.code`/`.path`. Zod guarantees at least one issue on `safeParse` failure, so this is practically unreachable — but `parseDocument`'s documented contract is "never throws", and a future Zod version or a malformed error object would turn a rejection into a TypeError at the untrusted-input seam. A one-line guard makes the contract robust.
**Fix:** `const first = parsed.error.issues[0] as ... | undefined; if (!first) return { ok: false, error: { code: 'invalid_envelope' } };`

### IN-03: Dead `unrecognized_keys` branch in the error mapper

**File:** `src/document/io.ts:76-78`
**Issue:** `first.code === 'unrecognized_keys'` can never fire — `z.object()` default-strips unknown keys and Zod emits `unrecognized_keys` only in strict mode, which the phase explicitly avoids (grep-verified no `.strict()`). If it ever did fire for a document-branch key, it would mislabel a document issue as `invalid_envelope`. Harmless today; either delete the branch or add a comment that it is defensive-only.
**Fix:** Remove the branch, or comment it as unreachable-under-strip-mode defensive code.

### IN-04: React `key={line}` on address lines collides for duplicate lines

**File:** `src/components/DocumentPage.tsx:54-56, 70-72`
**Issue:** Address lines are keyed by their text content; two identical address lines (e.g. a repeated "c/o ..." line) produce duplicate React keys, which can cause reconciliation artifacts. Use the index as part of the key.
**Fix:** `model.company.address.map((line, i) => <div key={`${i}-${line}`}>{line}</div>)` (same for customer).

### IN-05: Currency enum cast is a type lie with a module-load footgun

**File:** `src/document/types.ts:74`
**Issue:** `z.enum(Object.keys(CURRENCY_DECIMALS) as [string, ...string[]])` — the cast asserts a non-empty tuple that `Object.keys` does not guarantee. If `CURRENCY_DECIMALS` were ever emptied, `z.enum([])` throws at module import. Currently safe (2 entries, registry documented as the single point of change).
**Fix:** Optional — add a comment, or derive via `z.enum(Object.keys(CURRENCY_DECIMALS) as [keyof typeof CURRENCY_DECIMALS, ...])` and a runtime length check. Low priority.

### IN-06: Logo refine accepts any `data:` prefix, including non-image MIME types

**File:** `src/document/types.ts:49-54`
**Issue:** `value.startsWith('data:')` admits `data:text/html;base64,...`, `data:application/javascript,...`, etc. In the current renderer the logo is only ever used as `<img src>` (DocumentPage.tsx:51), where non-image data URLs are inert (no script execution in img context), so the T-02-02-LOGO threat (remote tracking/exfiltration) is mitigated. The looseness only becomes a risk if a future consumer places the logo in CSS `url()`/`background-image` or an `<object>`/iframe context.
**Fix:** Tighten the refine to image MIME types, e.g. `/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,/.test(value)` when non-img consumers appear.

---

_Reviewed: 2026-08-08T10:27:17Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
