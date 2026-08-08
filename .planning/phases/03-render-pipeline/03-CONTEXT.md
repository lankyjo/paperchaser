# Phase 3: Render Pipeline - Context

**Gathered:** 2026-08-08
**Status:** Ready for planning

<domain>
## Phase Boundary

The render bench that proves the product's core promise: documents render identically on screen and in PDF, controlled by style-only templates and branding. Seven templates (Blank, Minimal, Modern, Corporate, Freelancer, Agency, Creative) change typography/colors/borders/spacing/layout style only — never document structure (TEMP-03). Per-document branding (logo, primary/accent colors, fonts, header/footer style, watermark) layers on top. Print preview shows paginated page blocks matching the PDF. The golden-image parity harness extends to loop templates × fixtures in dev/CI.

The bench is NOT the Phase 4 builder — no inline canvas editing, layers, properties panel, drag-and-drop, undo/redo, zoom, or mobile sheets.

</domain>

<decisions>
## Implementation Decisions

### Branding persistence model
- **D-01:** Branding lives **per-document** on the model. Each document stores its own optional branding (colors, fonts, header/footer style, watermark override). New documents start from template defaults. Matches the UI-SPEC model fields.
  — **Reversibility:** costly — the branding shape is consumed by the renderer, the resolver, and the model schema; relocating it to a shared company profile later would touch all three plus stored documents.
- **D-02:** Unset branding fields resolve to the **active template's defaults**. The template is the base; branding only overrides what is explicitly set. ("Branding overrides sit ON TOP of template defaults" — UI-SPEC.)
- **D-03:** **No separate `branding.logo` field** — the renderer reuses the existing `company.logo` (data: URL only, T-02-02) for the header logo. One source of truth.
- **D-04:** Watermark color follows the **brand accent** (or template primary when accent unset). The 64px/rotate(-30°)/opacity 0.15 overlay geometry stays fixed.

### Fixture language migration
- **D-05:** Translate the German fixture content (invoice-torture, invoice-simple) to **English in-place** — same fixture ids, same shape, English content — then regenerate the committed golden baseline via `UPDATE_BASELINES=1`. One language set, single-pass harness.
  — **Reversibility:** costly — regenerated golden baselines and the translated fixtures are committed parity artifacts; reverting to German requires another baseline regeneration.
- **D-06:** Parity spec loops the torture fixture × **all 7 templates** (7 preview goldens + PDF page comparisons). Every template is proven parity-clean (PDF-06).
- **D-07:** Golden baselines are **A4-only** (harness geometry contract). A5/A3 pagination is verified via structure/pagination assertions through the existing ≥2-page torture path — no per-size golden images.

### Default template & back-compat
- **D-08:** **Minimal** is the default template for new documents and the empty-store seeded demo.
- **D-09:** `template`, `branding`, `pageSize` are **OPTIONAL** schema fields. A missing template resolves to Minimal at render time. Existing stored documents render immediately with **no Dexie migration** (TEMP-03: structure never changes).
- **D-10:** Switching a document's template re-resolves **unset** branding from the NEW template's defaults; explicitly-set branding overrides survive the switch.
- **D-11:** The render bench **seeds a demo document** (English, Minimal) when the documents store is empty on load. The `?fixture=` route stays for parity tests.

### Template engine architecture
- **D-12:** Templates are a **data-driven token registry** — each template is a plain TS token object (palette, fonts, borders, spacing, header/footer, table, totals — mirroring the UI-SPEC identity tables). Adding a template = adding a token file. DocumentPage stays template-agnostic.
  — **Reversibility:** costly — the token shape is the contract the resolver, the renderer, and the parity baselines build on; moving to per-template CSS classes later rewrites all three.
- **D-13:** Resolved tokens + branding overrides surface as **CSS custom properties** on `#print-root` (`--tpl-primary`, `--tpl-ink`, `--tpl-font-body`, ...). DocumentPage's stylesheet reads the variables; the print projection inherits automatically.
- **D-14:** Template+branding→token resolution lives in a **pure resolver** in `src/document/` (no React/DOM) — Node-unit-testable like totals.ts, preserving the "domain layer is pure" pattern.
- **D-15:** Print preview (BUIL-10) renders page blocks by **measure-and-slice** — render the document into a hidden measure container, slice by computed page-height offsets, render each slice as its own page block in the dialog. Same DOM, one truth, "Page 1 of N" counter.

### the agent's Discretion
No "you decide" answers were given this session — all areas were locked by explicit choice.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements
- `.planning/ROADMAP.md` §"Phase 3: Render Pipeline" — Phase goal, success criteria (TEMP-01–03, BRND-01–07, PDF-01–06, BUIL-10); note PDF-07/08 are Phase 6
- `.planning/REQUIREMENTS.md` §Templates / §Branding / §PDF / §Document Builder — TEMP-01/02/03, BRND-01..07, PDF-01..06, BUIL-10 requirement text
- `docs/adr/0001-framework.md` — Vite SPA + TanStack Router stack decision
- `docs/adr/0002-pdf-path.md` — Print-CSS primary PDF path; the parity-by-construction contract this phase extends to 7 templates

### UI design contract (locked this phase)
- `.planning/phases/03-render-pipeline/03-UI-SPEC.md` — APPROVED design contract: 7 template identities (palette hexes, fonts, borders, spacing, header/table/totals/footer), branding controls, page-size surface (A4/A5/A3), print-preview surface, copywriting (English), registry safety (add select/dialog/switch)

### Source PRD
- `/home/ikeji/Downloads/Invoice_Workspace_PRD_v1.md` §6.8 (templates/branding/rendering) — original requirements source

### Existing code
- `src/document/types.ts` — DocumentModel schema; Phase 3 adds optional `template`/`branding`/`pageSize` fields here (D-09)
- `src/components/DocumentPage.tsx` — THE shared render component; becomes token-variable-driven (D-13), keeps `#print-root`
- `src/styles/print.css` — print projection (@page A4, watermark, thead repeat, break-inside); unchanged except token-variable plumbing
- `src/document/fixtures.ts` — fixtures to translate to English in-place (D-05)
- `src/document/totals.ts` — `computeTotals`/`deriveWatermark`; pattern for the pure resolver (D-14)
- `tests/parity.spec.ts` — golden-image parity harness; extended to loop templates (D-06)
- `tests/helpers/raster.ts` — rasterization helpers used by the harness
- `src/db/repos.ts` — Dexie touchpoints for loading/seeding the demo document (D-11)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/DocumentPage.tsx` — the exact DOM rendered on screen AND print; already carries the 15mm/210×297mm geometry contract and `#print-root`. Phase 3 refactors its hardcoded inline styles onto template CSS variables.
- `src/styles/print.css` — @page A4 margin 0, `.watermark` overlay (currently fixed blue #1d4ed8 → becomes accent-colored per D-04), app-shell hiding, thead repeat, row break-inside. The token variables ride on the same element so print inherits.
- `src/document/totals.ts` — pure functions (`computeTotals`, `deriveWatermark`) that prove the "domain layer is pure" pattern the resolver (D-14) follows.
- `src/db/repos.ts` — document repo for loading + seeding the demo document; existing seams for the empty-store seed.
- `src/document/fixtures.ts` — invoice-torture (18 items, paginates ≥2 pages) and invoice-simple; translated in-place per D-05.
- `tests/parity.spec.ts` + `tests/helpers/raster.ts` + golden `tests/fixtures/invoice-torture.preview.png` — the parity harness to extend.

### Established Patterns
- **Parity by construction:** one DOM, three projections (screen / print / PDF) — no second layout engine. ADR 0002.
- **Pure domain layer:** no React/DOM/Dexie imports in `src/document/` — model, totals, and the new token resolver are Node-testable.
- **Money as integer minor units** — unchanged by this phase (rendering only).
- **Dexie versioning discipline** — Phase 3 adds NO schema migration (D-09 optional fields); version stays put.
- **Zod schemas as source of truth** — new fields get Zod definitions in types.ts.

### Integration Points
- `types.ts` gains optional `template` / `branding` / `pageSize` fields (D-09) — consumed by the resolver + DocumentPage.
- `src/components/DocumentPage.tsx` becomes prop-driven: `template` + `branding` + `pageSize` → resolver → CSS vars on `#print-root`.
- New token registry + resolver files land in `src/document/` (pure, testable).
- New render-bench route/UI (bench header, left rail with template gallery + branding controls, center canvas) replaces/extends the current index route; `.app-shell` chrome must stay hidden in print (print.css contract).
- New print-preview Dialog with measure-and-slice page blocks (D-15).
- Parity spec loops templates × torture fixture; `UPDATE_BASELINES=1` regenerates goldens (D-05/D-06).

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above — the user made explicit, standard choices for each gray area (per-document branding with template defaults, translate-and-regenerate fixtures, Minimal default with render-time back-compat, data-driven token registry with CSS variables and a pure resolver).

</specifics>

<deferred>
## Deferred Ideas

- **PDF download (PDF-07) and browser print surface (PDF-08)** — belong to Phase 6 (validation & shipping); Phase 3 print preview covers the on-screen pagination surface (BUIL-10) and `window.print()` only.
- **Company-profile-level branding defaults** — rejected for this phase: branding is per-document (D-01); a shared profile-level branding object with per-doc override is a Phase 5 concern if the reference-data phase needs it.

</deferred>

---

*Phase: 3-Render Pipeline*
*Context gathered: 2026-08-08*
