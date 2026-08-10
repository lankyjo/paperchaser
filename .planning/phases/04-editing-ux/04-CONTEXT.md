# Phase 4: Editing UX - Context

**Gathered:** 2026-08-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The three-pane WYSIWYG builder — the product's differentiator. On desktop: left pane (section outline/layers), center live canvas, right pane (element properties / document settings). The user edits content inline directly on the canvas, reorders sections and line items by drag-and-drop, duplicates/deletes/collapses line items, and edits every field (title, description, quantity, unit price, discount, tax) on the document. Undo/redo and auto-save protect the work; canvas zoom supports precision layout. On mobile: bottom sheets, drawers, and a sticky live preview deliver the same editing actions with touch.

This phase sits ON TOP of the parity-proven DocumentPage (ADR 0002, Phase 3). Editing must never break "identical preview/output" — the core promise. The render bench shell (RenderBench.tsx) becomes the builder shell; DocumentPage remains THE render component the canvas, print, and PDF all share.

</domain>

<decisions>
## Implementation Decisions

### Inline editing mechanics
- **D-01:** Inline text editing uses **contentEditable directly in the DOM** — not overlay inputs. Cells on the canvas are editable in place. This is the riskier-but-truer WYSIWYG path; the implementation must manage React/caret reconciliation carefully.
  — **Reversibility:** costly — the contentEditable controller, its reconciliation, and the caret handling are a cross-component contract; falling back to overlay inputs later rewrites the editing layer (though the model/parity surface is untouched).
- **D-02:** **Every field is edited inline on the canvas** — text and numbers alike. Nothing is relegated to the right pane for editing.
- **D-03:** The canvas is **always in edit mode** — no view/edit toggle. Editing chrome appears on interaction.
- **D-04:** Editing chrome (selection rings, drag handles, hover outlines, drop indicators) is **overlay chrome in the builder shell, never inside `#print-root`** (src/components/DocumentPage.tsx:133). The parity DOM is untouched by construction; print.css already hides builder chrome.
- **D-05:** contentEditable content is **rich text** — bold, italic, underline, bulleted list, link. The user explicitly chose rich over plain-text.
  — **Reversibility:** costly — rich text changes the stored model shape (D-06) which touches schema, fixtures, IO, renderer, and parity.
- **D-06:** Rich text is stored as a **JSON AST in the model** (like Tiptap/Lexical JSON), NOT HTML strings. Zod-validated, JSON-safe, no HTML-injection surface. Implementation may hand-roll a minimal node array or adopt Tiptap — the model stores the AST either way.
  — **Reversibility:** one-way — this is the on-disk document shape; stored documents and the export envelope depend on it. Undoing means a migration of every stored document plus fixture/parity regeneration.
- **D-07:** **Every text node** in the document becomes rich-text-capable — including names, addresses, labels, and header/footer text, not just body descriptions.
  — **Reversibility:** one-way — see D-06; this maximizes the schema surface that changes.
- **D-08:** The rich-text surface exposes a **minimal formatting set**: bold, italic, underline, bulleted list, link. No headings/colors/alignment in v1.
- **D-09:** Numeric cells (qty, unit price, discount, tax) are **contentEditable-but-filtered** inline (`inputMode=decimal`, keystroke filter, parse-to-minor-units on commit, inline validation on invalid), with a **small focused popover as the fallback** for edge cases (negative, NaN, 0dp JPY per CURRENCY_DECIMALS). Money conversion uses the existing minor-unit primitives in src/document/money.ts — never bare floats.
- **D-10:** Edits **commit on blur AND Enter; Escape cancels**. React re-renders from the model on commit; cells are keyed by field so caret position survives.
- **D-11:** Parity guard = **one DOM, edit attrs in place**. Edit mode renders contentEditable attributes on the SAME cells the view renders (same tree, same text). The parity harness must also run against the edit-mode DOM (goldens unchanged); a spec asserts the print projection has no editing artifacts (no caret, no outline).

### Undo/redo & auto-save
- **D-12:** Undo/redo uses **model snapshots** — push the whole document model onto an undo stack before each committed edit. Not a command pattern.
- **D-13:** Undo covers **all model changes**: text edits, line-item CRUD/reorder, template/branding/page-size changes. Each committed edit (blur/Enter) is one undo step.
- **D-14:** History is **bounded** (e.g. last 50 snapshots) — no unbounded memory growth.
- **D-15:** Auto-save is a **debounced write** (~800ms after last change) to documentsRepo, replacing the current write-through-every-change behavior in RenderBench.tsx:186-208.
  — **Reversibility:** reversible — debounce interval and mechanism are local to the save layer.
- **D-16:** A **Saved/Saving indicator** in the builder header shows the save state.
- **D-17:** On save failure: **toast + unsaved badge**, and the in-memory model is never discarded.
- **D-18:** Undo/redo triggered by **native shortcuts** (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z) while the builder is focused. No on-screen buttons required (planner may add at discretion).

### Mobile interaction spec
- **D-19:** The **mobile interaction sub-spec is produced IN this phase** as `.planning/phases/04-editing-ux/04-MOBILE-SPEC.md` — the design artifact the STATE.md blocker requires before mobile builder implementation. The planner and researcher reference it.
- **D-20:** Mobile screen structure: **top header (back/save/undo, preview toggle) + sticky live preview of the page on top + editor surface below**. Tapping a section opens its properties in a bottom sheet.
- **D-21:** **`react-spring-bottom-sheet` (https://github.com/stipsan/react-spring-bottom-sheet) is the library for all sheet/drawer surfaces on mobile** — user-specified. Researcher MUST verify React 19 / Base UI compatibility and fallback if it does not support the stack.
  — **Reversibility:** costly — a UI-surface dependency used across the mobile builder; swapping the sheet library later touches every mobile editing surface.
- **D-22:** Desktop/mobile switch uses a **single breakpoint** (e.g. <1024px mobile-first stacked; >=1024 three-pane).
- **D-23:** On touch, reordering uses **up/down controls** (avoids drag-vs-scroll conflicts inside sheets); drag-and-drop is desktop-only.
- **D-24:** Canvas zoom is **desktop-only**; the mobile sticky preview renders at **fit-width** (auto-scale, browser pinch-zoom).

### Section model & outline
- **D-25:** Sections stay **implicit** — NO explicit sections array in the model. The outline lists the fixed render blocks (Header, Bill to, Items, Totals, Footer) as virtual entries; the model keeps its current shape. No section-related migration.
  — **Reversibility:** costly — adding a real sections concept later changes schema, renderer, and templates together.
- **D-26:** "Reorder sections" = **reorder line items only** (BUIL-05). The fixed blocks get **show/hide visibility toggles** in the outline, NOT reordering — invoice structure order is fixed by convention.
- **D-27:** The left-pane outline shows **the fixed blocks PLUS each line item**, with click-to-select, a visibility toggle per block, and drag reorder for line items.
- **D-28:** A line item's **collapsed state is UI-only transient state** — collapsed shows one compact row; NOT stored in the model.
- **D-29:** **Rich text (D-06/D-07) forces a Dexie `version(3)` migration** — accepted by the user. Every text field in the model changes shape (string → JSON AST), plus the model gains the rich-text fields. Stored documents and parity fixtures regenerate in this phase.
  — **Reversibility:** one-way — see D-06/D-07; the migration rewrites all stored documents.
- **D-30:** Block visibility (D-26) is **persisted per-document** — a small optional settings field on the model, so a hidden block stays hidden across reloads and prints. Folds into the same `version(3)` migration as D-29.

### the agent's Discretion
- **Canvas zoom implementation (BUIL-09):** mechanism left to the planner (CSS transform scale on the canvas is the obvious fit; must stay screen-only so print is untouched). Zoom is desktop-only per D-24.
- **Right-pane contents:** since everything is edited inline (D-02), the right pane holds selected-element properties + document settings (template/branding/page-size, the existing BrandingPanel). Exact arrangement is planner discretion; the three-pane layout itself is BUIL-01.
- **LINE-01 "optional image" on line items:** the current `lineItemSchema` (src/document/types.ts:32-43) has NO image field, though LINE-01 requires it. Since D-29 already forces a `version(3)` migration, adding the optional line-item image field should fold into the same migration — researcher/planner should confirm this is in scope and handle the data: URL constraint per T-02-02.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements
- `.planning/ROADMAP.md` §"Phase 4: Editing UX" — Phase goal, success criteria (BUIL-01..09, LINE-01, LINE-02)
- `.planning/REQUIREMENTS.md` §Document Builder / §Line Items — BUIL-01..09, LINE-01, LINE-02 requirement text
- `/home/ikeji/Downloads/Invoice_Workspace_PRD_v1.md` §6.2 (Document Builder — three-pane/mobile layouts, builder capabilities) and §6.7 (Line Items) — original requirements source

### Architecture & decisions
- `docs/adr/0001-framework.md` — Vite SPA + TanStack Router stack; the builder builds into this
- `docs/adr/0002-pdf-path.md` — Print-CSS primary PDF path; "identical preview/output" is the parity contract the editor must not break (D-04, D-11)
- `.planning/phases/03-render-pipeline/03-CONTEXT.md` — Phase 3 decisions (D-01..D-15) the editor layers on: per-document branding, template defaults, DocumentPage prop contract

### Mobile interaction (locked this phase)
- `.planning/phases/04-editing-ux/04-MOBILE-SPEC.md` — REQUIRED design artifact (D-19), to be produced before mobile builder implementation; STATE.md blocker
- `https://github.com/stipsan/react-spring-bottom-sheet` — the library for all mobile sheet/drawer surfaces (D-21); verify React 19/Base UI compatibility

### Existing code (Phase 1-3 surface)
- `src/document/types.ts` — DocumentModel + lineItemSchema; THIS is what D-06/D-07/D-29/D-30 change (rich-text AST, optional line-item image, block visibility, Dexie v(3))
- `src/components/DocumentPage.tsx` — THE shared render component (`#print-root` at line 133); edit attrs layer on its cells (D-01, D-11); chrome never enters it (D-04)
- `src/components/RenderBench.tsx` — current bench shell; becomes the builder shell (three panes); its write-through handlers (lines 186-208) are replaced by the debounced save (D-15)
- `src/components/BrandingPanel.tsx` — right-pane property panel precedent
- `src/db/repos.ts` — documentsRepo get/put seam for auto-save and the demo document
- `src/document/money.ts` — minor-unit primitives + CURRENCY_DECIMALS for numeric cell conversion (D-09)
- `src/styles/print.css` — print projection; must show no editing artifacts (D-11)
- `src/lib/useMountEffect.ts` — the sanctioned mount wrapper (house rule: no direct useEffect)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/DocumentPage.tsx` — THE render component for screen/print/PDF. Edit mode adds contentEditable attrs on its existing cells (D-01/D-11); the DOM shape must not otherwise change.
- `src/components/RenderBench.tsx` — bench shell with 320px left rail + centered canvas + header; becomes the three-pane builder. Its TemplateGallery/BrandingPanel wiring and per-document write-back handlers are the seam D-15 replaces.
- `src/components/BrandingPanel.tsx` — pattern for a right-pane property panel (label + control rows).
- `src/document/money.ts` + `src/document/totals.ts` — minor-unit conversion and derived totals the inline numeric cells (D-09) must route through.
- `src/db/repos.ts` — documentsRepo.put/get for auto-save, demo seed, and the Dexie v(3) migration (D-29).
- `src/lib/useMountEffect.ts` — the only sanctioned way to run mount-time side effects (house rule in AGENTS.md).
- `src/components/ui/*` (dialog, select, input, button, label, card) — building blocks for panes, popovers, sheets, and the floating toolbar.

### Established Patterns
- **Parity by construction:** one DOM, three projections (screen/print/PDF) — the editor layers editing chrome outside `#print-root` (D-04) and commits to the same DOM (D-11).
- **Pure domain layer:** no React/DOM/Dexie imports in `src/document/` — the rich-text AST (D-06) and any edit operations stay Node-testable.
- **Money as integer minor units:** numeric cells convert via money.ts primitives, never floats (D-09).
- **Zod schemas as source of truth:** rich-text AST and block-visibility fields get Zod definitions in types.ts.
- **Dexie versioning discipline:** D-29/D-30 bump to `version(3)` with a migration path for stored documents; repos are the only Dexie touchpoint.
- **House rule — no direct `useEffect`:** mount/side-effect logic uses `useMountEffect` or data-fetching hooks; the editor's save/undo wiring must follow this.

### Integration Points
- `types.ts` — every text field → rich-text AST (D-06/D-07), optional line-item image (LINE-01), optional block-visibility settings (D-30); consumed by renderer, IO, fixtures.
- `db.ts` / `repos.ts` — Dexie `version(3)` migration (D-29/D-30); debounced save replaces write-through (D-15).
- `routes/index.tsx` — the bench route becomes the builder route; three-pane layout (BUIL-01) and single mobile breakpoint (D-22).
- `DocumentPage.tsx` — edit attrs on existing cells (D-01/D-11); hidden blocks (D-26/D-30) affect which sections render.
- `tests/parity.spec.ts` — extended to assert edit-mode DOM == view DOM (D-11) and that print projection carries no editing artifacts.
- `BrandingPanel.tsx` / template gallery — move into the right pane (BUIL-01) alongside document settings.

</code_context>

<specifics>
## Specific Ideas

The user made explicit, opinionated choices on the high-risk areas: **contentEditable in the DOM** (not overlay inputs), **rich text for every text node** stored as a **JSON AST**, and **react-spring-bottom-sheet** for all mobile sheets — all three carry real implementation risk the researcher/planner must treat seriously. Zoom, right-pane contents, and the line-item image field are left to agent discretion (documented above).

</specifics>

<deferred>
## Deferred Ideas

- **Explicit section model** (real ordered sections array with per-section content) — rejected for this phase (D-25); would need schema + renderer + template changes together. Revisit only if a future phase genuinely needs arbitrary block composition.
- **Rich text beyond the minimal formatting set** (headings, colors, alignment, numbered lists) — deferred; the AST (D-06) leaves room to grow, but v1 ships the minimal set (D-08).

</deferred>

---

*Phase: 4-Editing UX*
*Context gathered: 2026-08-10*
