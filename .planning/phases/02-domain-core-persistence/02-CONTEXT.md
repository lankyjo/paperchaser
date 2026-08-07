# Phase 2: Domain Core & Persistence - Context

**Gathered:** 2026-08-07
**Status:** Ready for planning

<domain>
## Phase Boundary

The pure document model (invoice/quote/receipt sharing one engine), the totals/money engine, IndexedDB persistence for all five stores (company profile, customers, product catalog, documents, preferences), and single-document JSON import/export — with zero UI. This is the parity contract every later phase consumes: Phase 3 renders it, Phase 4 edits it, Phase 5 maintains the reference data, Phase 6 validates and ships it.

</domain>

<decisions>
## Implementation Decisions

### Money math & rounding
- **D-01:** Line-item totals and the document subtotal are rounded **per line, then summed**. Each line total (qty × unit price, after line discount) rounds to the currency's minor-unit precision; the subtotal is the sum of the rounded line nets. Rounding happens once per line and never cascades.
  — **Reversibility:** costly — changing the rounding policy later would rewrite the totals contract and every template/parity fixture that depends on exact cent values.
- **D-02:** Prices are **tax-exclusive (net)** by default. Unit prices exclude tax; tax is added on top per line. No per-document net/gross toggle.
- **D-03:** Per-line tax = **rounded line net × line tax rate**, and that result rounds to minor units. The printed line amount and the totals below it always reconcile.
- **D-04:** Document tax total is **grouped by rate** (e.g., 19%: €X, 7%: €Y) in the model. Rendering may collapse it to one line, but the model retains the per-rate breakdown.
  — **Reversibility:** costly — the grouped-by-rate shape is what most EU/UK invoice layouts expect; changing it later touches the model and all renderers.

### Discounts, shipping & fees
- **D-05:** Discounts exist at **both levels**: a per-line discount reducing that line, and a document-level discount applied to the subtotal after all line discounts.
- **D-06:** Each discount instance is **either percentage OR flat amount** (a `kind` of `percent | amount` and a value). Per-line and document-level discounts both follow this.
- **D-07:** Shipping and fees are **line-like entries with their own amount and optional tax rate** — a shipping charge can carry the same VAT rate as goods or be untaxed. The totals engine treats them uniformly.
- **D-08:** A document may have **multiple** shipping/fee entries (array), each with a label. They collapse into single totals.

### Document types & differences
- **D-09:** **One DocumentModel with a `type` tag** — `'invoice' | 'quote' | 'receipt'` — sharing one schema and one totals engine.
  — **Reversibility:** one-way — this is the schema shape every later phase (render, edit, validate) is built on; splitting into per-type schemas later would require a migration across all stored documents and all downstream code.
- **D-10:** Receipts use the **same fields** as invoices/quotes; semantic differences are expressed through status, not a separate shape. The totals engine stays one code path.
- **D-11:** Document status is an **explicit `status` field** — e.g., invoices/quotes `draft | sent | paid`, receipts start paid — and the watermark (`'draft' | null` in the Phase 1 model) **derives from status**, not the other way around. Dashboard stats read the status field directly.
  — **Reversibility:** costly — moving status into watermark-derived state later would conflate a presentational flag with business state across the model, renderers, and dashboard.

### Currency & import/export
- **D-12:** Phase 2 registers **EUR (2dp) and JPY (0dp)** in the currency registry, exercising both decimal policies as the success criteria requires. The engine is decimal-aware by design so additional currencies are registry entries, not model changes. (MONEY-01 multi-currency UX remains v2.)
- **D-13:** Exported JSON uses a **versioned envelope** — `{ format: 'paperchaser-document', version: 1, document: {...} }` — not a bare document object.
  — **Reversibility:** one-way — the export format is a user-visible contract (documents may be backed up and stored externally); changing the envelope shape breaks previously exported files.
- **D-14:** The import boundary is **strict on shape, strips unknowns**. Required fields must match the schema exactly (malformed imports rejected, per STOR-04); unknown extra fields are dropped. Missing/extra data never silently corrupts a document.
- **D-15:** **Add Zod** for import/export schema validation. Its schemas are the source of truth for the document shape and provide the runtime type guards the boundary needs (PRD §7 pins Zod).

### the agent's Discretion
No "you decide" answers were given this session — all areas were locked by explicit choice.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements
- `.planning/ROADMAP.md` §"Phase 2: Domain Core & Persistence" — Phase goal, success criteria (LINE-03, STOR-01–04)
- `.planning/REQUIREMENTS.md` §Line Items & Totals / §Storage — LINE-03 (totals), STOR-01/02 (IndexedDB), STOR-03/04 (single-doc JSON export/import); MONEY-01 (multi-currency) noted as v2
- `docs/adr/0001-framework.md` — Vite SPA + TanStack Router decision; the stack this phase builds into
- `docs/adr/0002-pdf-path.md` — Print-CSS primary PDF path; the parity contract the totals engine must feed

### Source PRD
- `/home/ikeji/Downloads/Invoice_Workspace_PRD_v1.md` §5 (shared engine), §6.7 (line items & totals), §6.10 (storage), §7 (Zod pin) — original requirements source

### Existing code (Phase 1 seed)
- `src/document/types.ts` — the pure, JSON-serializable document model seed (LineItem, Company, Customer, DocumentModel); Phase 2 extends it
- `src/db/db.ts` — Dexie stub; `version(1).stores({})` is empty by design, Phase 2 owns `version(2)` (versioning discipline per PITFALLS.md:78)
- `src/document/fixtures.ts` — fixture documents (invoice-torture, invoice-simple) the parity harness and future unit fixtures build on

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/document/types.ts` — renderer-agnostic model seed already storing money as integer minor units (`unitPriceMinor`, `taxRateMinor`); Phase 2 extends it with type tag, status, discounts, shipping/fees, and the currency field
- `src/db/db.ts` — Dexie instance named `paperchaser`; v1 empty stub signals Phase 2 owns the real tables via `version(2)`
- `src/document/fixtures.ts` — torture + simple invoice fixtures usable as the basis for money-engine and persistence test fixtures

### Established Patterns
- Domain layer is pure: no React, DOM, or Dexie imports in `types.ts` — Phase 2 code must preserve this (model/engine testable in Node)
- Money is integer minor units, never floats (PITFALLS.md:232) — the totals engine continues this
- Dexie versioning discipline starts with the first schema commit (PITFALLS.md:78)
- Tests use Playwright + fixture documents; unit fixtures are the verification vehicle for money math (success criterion 2)

### Integration Points
- `types.ts` becomes the shared `DocumentModel` with `type`/`status`/`currency` tags — consumed by the totals engine and the future render/editing phases
- `db.ts` gains `version(2)` tables: company, customers, catalog, documents, preferences
- A new import/export module (Zod-schema'd) sits at the document boundary; the v2 workspace backup (STOR-05/06, Phase 6) will reuse the same envelope/validation machinery

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above — the user made explicit, standard choices for each gray area (per-line rounding, net prices, grouped tax, one shared model, versioned envelope, Zod).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Domain Core & Persistence*
*Context gathered: 2026-08-07*
