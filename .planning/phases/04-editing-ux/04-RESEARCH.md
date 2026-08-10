# Phase 4: Editing UX - Research

**Researched:** 2026-08-10
**Domain:** Rich-text AST editing, contentEditable + React reconciliation, undo/redo + auto-save, drag-and-drop, Dexie data migration, mobile bottom sheets
**Confidence:** MEDIUM

## Summary

Phase 4 turns the parity-proven DocumentPage (ADR 0002) into a three-pane WYSIWYG builder. The single biggest technical decision — how rich text is edited and stored (D-05/D-06) — resolves cleanly in favor of a **hand-rolled minimal JSON AST with uncontrolled contentEditable cells (commit-on-blur)** rather than Tiptap. The deciding evidence is D-11's literal contract ("contentEditable attributes on the SAME cells the view renders — same tree, same text"): Tiptap/ProseMirror manages a *second* DOM, permanently coupling the parity harness to Tiptap's DOM conventions as the template system evolves. A hand-rolled node-array AST (paragraph/text/listItem + bold/italic/underline/link marks) is small enough to own (~300-500 pure, unit-testable lines), the format surface is deliberately minimal (D-08), and the AST is the durable seam — the editing engine under it is replaceable if the surface grows. The critical safety property: **a plain-string AST (single paragraph, single text node) renders pixel-identical to today's plain strings, so the golden baselines stay green and prove the v2→v3 migration is visually lossless.**

The other locked risks resolve as follows. **react-spring-bottom-sheet (D-21) does not support React 19** — its peerDependencies are `react: '^16.14.0 || 17 || 18'` [VERIFIED: npm registry], and it pulls react-spring v8 / @reach/portal / body-scroll-lock, all pre-React-19. The D-21 escape hatch ("fallback if it does not support the stack") is triggered: recommend a **hand-rolled BottomSheet built on Base UI Dialog** (already in the stack via `src/components/ui/dialog.tsx`), which delivers the UI-SPEC contract (backdrop, Escape, focus trap, scroll lock, safe-area) from primitives plus a small slide-up/spring animation. **Dexie version(3)** is a pure data migration — the table schema strings are unchanged (no new indexes), so `db.version(3).stores(…same strings…).upgrade(trans => …)` rewrites stored document text fields string→AST via one pure function in `src/document`. **Undo/redo and auto-save need zero useEffect** — history is refs + event handlers, the debounce is a ref-held timer, and keyboard shortcuts bind to the builder root's onKeyDown. **Drag-and-drop** (desktop-only, D-23/D-24) should use `@dnd-kit/core` + `@dnd-kit/sortable` (React-19 compatible, `>=16.8`, 22M downloads/wk) rather than hand-rolled pointer tracking — accessibility and scroll-container edge cases are exactly the kind of thing not to own.

**Primary recommendation:** hand-rolled minimal AST (Zod-validated, React-free in `src/document`) + uncontrolled contentEditable cells with commit-on-blur/Enter, formatting via native `document.execCommand` (deprecated but universally supported and — per MDN — preserves the in-cell undo buffer), plain-text paste in v1, `@dnd-kit` for line-item reorder, `@base-ui/react` Dialog for the mobile bottom sheet, and a pure v2→v3 migration function exercised through the existing persistence spec.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Inline text editing uses **contentEditable directly in the DOM** — not overlay inputs. Cells on the canvas are editable in place. The implementation must manage React/caret reconciliation carefully.
  — **Reversibility:** costly — the contentEditable controller, its reconciliation, and the caret handling are a cross-component contract; falling back to overlay inputs later rewrites the editing layer (though the model/parity surface is untouched).
- **D-02:** **Every field is edited inline on the canvas** — text and numbers alike. Nothing is relegated to the right pane for editing.
- **D-03:** The canvas is **always in edit mode** — no view/edit toggle. Editing chrome appears on interaction.
- **D-04:** Editing chrome (selection rings, drag handles, hover outlines, drop indicators) is **overlay chrome in the builder shell, never inside `#print-root`** (src/components/DocumentPage.tsx:133). The parity DOM is untouched by construction; print.css already hides builder chrome.
- **D-05:** contentEditable content is **rich text** — bold, italic, underline, bulleted list, link. The user explicitly chose rich over plain-text.
- **D-06:** Rich text is stored as a **JSON AST in the model** (like Tiptap/Lexical JSON), NOT HTML strings. Zod-validated, JSON-safe, no HTML-injection surface. Implementation may hand-roll a minimal node array or adopt Tiptap — the model stores the AST either way.
- **D-07:** **Every text node** in the document becomes rich-text-capable — including names, addresses, and labels, and header/footer text, not just body descriptions.
- **D-08:** The rich-text surface exposes a **minimal formatting set**: bold, italic, underline, bulleted list, link. No headings/colors/alignment in v1.
- **D-09:** Numeric cells (qty, unit price, discount, tax) are **contentEditable-but-filtered** inline (`inputMode=decimal`, keystroke filter, parse-to-minor-units on commit, inline validation on invalid), with a **small focused popover as the fallback** for edge cases (negative, NaN, 0dp JPY per CURRENCY_DECIMALS). Money conversion uses the existing minor-unit primitives in src/document/money.ts — never bare floats.
- **D-10:** Edits **commit on blur AND Enter; Escape cancels**. React re-renders from the model on commit; cells are keyed by field so caret position survives.
- **D-11:** Parity guard = **one DOM, edit attrs in place**. Edit mode renders contentEditable attributes on the SAME cells the view renders (same tree, same text). The parity harness must also run against the edit-mode DOM (goldens unchanged); a spec asserts the print projection has no editing artifacts (no caret, no outline).
- **D-12:** Undo/redo uses **model snapshots** — push the whole document model onto an undo stack before each committed edit. Not a command pattern.
- **D-13:** Undo covers **all model changes**: text edits, line-item CRUD/reorder, template/branding/page-size changes. Each committed edit (blur/Enter) is one undo step.
- **D-14:** History is **bounded** (e.g. last 50 snapshots) — no unbounded memory growth.
- **D-15:** Auto-save is a **debounced write** (~800ms after last change) to documentsRepo, replacing the current write-through-every-change behavior in RenderBench.tsx:186-208.
- **D-16:** A **Saved/Saving indicator** in the builder header shows the save state.
- **D-17:** On save failure: **toast + unsaved badge**, and the in-memory model is never discarded.
- **D-18:** Undo/redo triggered by **native shortcuts** (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z) while the builder is focused. No on-screen buttons required (planner may add at discretion).
- **D-19:** The **mobile interaction sub-spec is produced IN this phase** as `.planning/phases/04-editing-ux/04-MOBILE-SPEC.md`.
- **D-20:** Mobile screen structure: **top header (back/save/undo, preview toggle) + sticky live preview of the page on top + editor surface below**. Tapping a section opens its properties in a bottom sheet.
- **D-21:** **`react-spring-bottom-sheet` is the library for all sheet/drawer surfaces on mobile** — user-specified. Researcher MUST verify React 19 / Base UI compatibility and fallback if it does not support the stack.
- **D-22:** Desktop/mobile switch uses a **single breakpoint** (e.g. <1024px mobile-first stacked; >=1024 three-pane).
- **D-23:** On touch, reordering uses **up/down controls**; drag-and-drop is desktop-only.
- **D-24:** Canvas zoom is **desktop-only**; the mobile sticky preview renders at **fit-width**.
- **D-25:** Sections stay **implicit** — NO explicit sections array in the model. The outline lists the fixed render blocks (Header, Bill to, Items, Totals, Footer) as virtual entries.
- **D-26:** "Reorder sections" = **reorder line items only** (BUIL-05). The fixed blocks get **show/hide visibility toggles** in the outline, NOT reordering.
- **D-27:** The left-pane outline shows **the fixed blocks PLUS each line item**, with click-to-select, a visibility toggle per block, and drag reorder for line items.
- **D-28:** A line item's **collapsed state is UI-only transient state** — NOT stored in the model.
- **D-29:** **Rich text (D-06/D-07) forces a Dexie `version(3)` migration** — every text field in the model changes shape (string → JSON AST), plus the model gains the rich-text fields. Stored documents and parity fixtures regenerate in this phase.
- **D-30:** Block visibility (D-26) is **persisted per-document** — a small optional settings field on the model. Folds into the same `version(3)` migration as D-29.

### the agent's Discretion

- **Canvas zoom implementation (BUIL-09):** mechanism left to the planner (CSS transform scale on the canvas is the obvious fit; must stay screen-only so print is untouched). Zoom is desktop-only per D-24.
- **Right-pane contents:** since everything is edited inline (D-02), the right pane holds selected-element properties + document settings (template/branding/page-size, the existing BrandingPanel). Exact arrangement is planner discretion; the three-pane layout itself is BUIL-01.
- **LINE-01 "optional image" on line items:** the current `lineItemSchema` (src/document/types.ts:32-43) has NO image field, though LINE-01 requires it. Since D-29 already forces a `version(3)` migration, adding the optional line-item image field should fold into the same migration — researcher/planner should confirm this is in scope and handle the data: URL constraint per T-02-02.

### Deferred Ideas (OUT OF SCOPE)

- **Explicit section model** (real ordered sections array with per-section content) — rejected for this phase (D-25).
- **Rich text beyond the minimal formatting set** (headings, colors, alignment, numbered lists) — deferred; v1 ships the minimal set (D-08).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUIL-01 | Desktop builder has three panes: left (sections/outline), center (live canvas), right (element properties, document settings) | RenderBench.tsx becomes the builder shell; outline = 5 virtual blocks + line items (D-25/D-27); right pane = selected-element props + Phase-3 gallery/branding moved from the bench rail (UI-SPEC §Builder Shell Layout) |
| BUIL-02 | Mobile builder uses bottom sheets, drawers, full-screen editors, sticky live preview | D-21 fallback: hand-rolled BottomSheet on Base UI Dialog (react-spring-bottom-sheet lacks React 19 peer support — see Standard Stack); single <1024px breakpoint (D-22); 04-MOBILE-SPEC.md artifact per D-19 |
| BUIL-03 | User edits the document live on the canvas (WYSIWYG) | Hand-rolled contentEditable cells (D-01); edit attrs on the SAME cells the view renders (D-11) — one rendering path, parity by construction |
| BUIL-04 | User can reorder sections by drag-and-drop | D-26: section reorder = reorder line items only; fixed blocks get visibility toggles, not reorder; @dnd-kit/sortable desktop-only (D-23) |
| BUIL-05 | User can reorder line items by drag-and-drop | @dnd-kit/sortable vertical list on the canvas rows + outline; touch uses up/down controls (D-23) |
| BUIL-06 | User can edit content inline without leaving the canvas | Every field inline (D-02); rich cells = AST contentEditable, numeric cells = filtered contentEditable + popover fallback (D-09); commit on blur/Enter, Escape cancels (D-10) |
| BUIL-07 | User can undo and redo edits | Model-snapshot history (D-12), one snapshot per committed edit (D-13), bounded 50 (D-14), native shortcuts (D-18), zero useEffect |
| BUIL-08 | Document auto-saves as the user works | Debounced (~800ms) write to documentsRepo replacing write-through (D-15); Saved/Saving indicator (D-16); failure → toast + badge, model never discarded (D-17) |
| BUIL-09 | User can zoom the canvas | CSS transform scale on the canvas wrapper, desktop-only (D-24), print-reset variant so #print-root geometry is untouched; bounds per UI-SPEC §overflow (zoom controls) |
| LINE-01 | Line item supports title, description, quantity, unit price, discount, tax, optional image | CONFIRMED in scope: `lineItemSchema` gains optional `image` (reuse the data:-URL-refined `logoSchema` per T-02-02); folds into the version(3) migration (CONTEXT discretion) |
| LINE-02 | User can duplicate, delete, reorder, and collapse line items | Outline + canvas row actions (delete with confirm dialog per UI-SPEC copy), dnd-kit reorder, up/down on touch (D-23), collapse = UI-only transient state (D-28) |
</phase_requirements>

## Project Constraints (from AGENTS.md)

No `./AGENTS.md` exists in the repo root (checked this session). The global agent configuration at `/home/ikeji/.config/opencode/AGENTS.md` applies to execution:

- **React: no direct `useEffect` in components.** Use derived state, data-fetching hooks, event handlers, key-based resets, or a mount wrapper. The sanctioned wrapper exists in-repo: `src/lib/useMountEffect.ts` [VERIFIED: src/lib/useMountEffect.ts:9-11 — `export function useMountEffect(effect: () => void | (() => void)) { useEffect(effect, []) }`]. The undo/redo + auto-save design in this research (refs + event handlers + ref-held debounce timers) is deliberately useEffect-free.
- **Codebase discovery:** prefer codebase-memory MCP graph tools over grep/glob for structural queries; fall back to grep for string/config searches. (Graph not materialized for this repo — `.planning/graphs/graph.json` absent this session.)
- **Code gates (plugin-enforced):** tdd-gate (test-first on source edits when enabled), subagent-gate (coordinator may edit code inline only while surgical), nestjs-gate (n/a — no NestJS), code-pipeline (simplify → pipeline-verify → security-review on source changes).
- **CI baseline (`.github/workflows/ci.yml`, verified):** `pnpm lint` (oxlint) → `pnpm typecheck` (tsc -b) → `pnpm test:unit` (vitest) → `pnpm build` → `pnpm exec playwright install --with-deps chromium` → `pnpm test` (playwright parity spec). The phase's new tests must slot into these gates.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rich-text editing (contentEditable, caret) | Browser / Client | — | contentEditable is a browser-DOM editing surface; the editor controller lives in the React layer, never in `src/document` (pure-domain rule) |
| AST model, Zod schemas, serialize/parse/migrate | Database / Storage (domain model) | — | `src/document/types.ts` is the React-free source of truth; AST parse/serialize/migrate are pure functions unit-tested in Node (Phase-2 pattern) |
| Document rendering (view + print + PDF) | Browser / Client | — | `DocumentPage` is THE single render component shared by canvas, print, dialog, PDF (ADR 0002); edit attrs layer onto its cells (D-11) |
| Editing chrome (rings, handles, toolbar, drop indicators) | Browser / Client (builder shell) | — | Overlay in the shell, keyed to cell bounding rects; never inside `#print-root` (D-04) |
| Undo/redo history + debounced auto-save | Browser / Client | Database / Storage | History is in-memory model snapshots (D-12); persistence is documentsRepo.put through the existing repos seam (D-15) |
| Block visibility (show/hide) | Browser / Client | Database / Storage | Render-time skip in DocumentPage; persisted per-document via the settings field (D-30) |
| Drag-and-drop reorder (desktop) | Browser / Client | — | Pointer/keyboard/touch sensors in the builder shell; mobile uses up/down controls instead (D-23) |
| Mobile bottom sheets | Browser / Client | — | Base UI Dialog-based BottomSheet in the builder shell |
| Numeric input validation | Browser / Client | — | Keystroke filter + parse-to-minor-units via `src/document/money.ts` primitives (D-09), never floats |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Hand-rolled rich-text AST (no library) | — | Node-array AST (`doc` → `paragraph`/`text`/`listItem` + `bold`/`italic`/`underline`/`link` marks) with Zod schema, serialize/parse, migrate | D-11 demands ONE DOM with edit attrs in place; a minimal AST is ~300-500 pure lines, and the AST is the durable seam — the engine under it is swappable (D-06 allows either; recommendation in this research) |
| `@base-ui/react` Dialog (already installed, ^1.7.0) | ^1.7.0 | Foundation for the mobile BottomSheet (Portal/Backdrop/Close primitives) | Stack-native: `src/components/ui/dialog.tsx` already wraps it [VERIFIED: src/components/ui/dialog.tsx:3 — `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"`]; gives focus trap, Escape, aria-hidden, scroll containment for free — the D-21 fallback |
| `@dnd-kit/core` + `@dnd-kit/sortable` | 6.3.1 / 10.0.0 | Desktop line-item reorder (canvas rows + outline) | De-facto standard sortable DnD; peerDeps `react: '>=16.8.0'` (React 19 OK) [VERIFIED: npm registry]; built-in keyboard/pointer sensors + collision handling; classic stable API (the new `@dnd-kit/dom`+`@dnd-kit/react` v2 line is still rolling out) |
| `@tiptap/react` + starter-kit + underline + link (escalation path only) | 3.29.2 | NOT installed this phase — the documented upgrade path if the AST surface outgrows v1 | React 19 peer-verified (`react: '^17 || ^18 || ^19'`) [VERIFIED: npm registry]; getJSON/setContent round-trip matches a ProseMirror-shaped AST; BubbleMenu covers the floating toolbar — see Alternatives |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/document/money.ts` (in-repo) | — | Minor-unit parse/format for numeric cells (D-09) | All numeric commit paths; never bare floats |
| `src/lib/useMountEffect.ts` (in-repo) | — | The only sanctioned mount wrapper | Mount-time side effects (seed/load demo, one-time document-level key listeners if needed) |
| `tw-animate-css` (already installed) | ^1.4.0 | BottomSheet slide-up/backdrop animations | Matches the Phase-3 dialog animation pattern (ui/dialog.tsx uses `data-open:animate-in` classes) |
| `lucide-react` (already installed) | ^1.29.0 | Toolbar icons (Bold, Italic, Underline, List, Link), drag handles, up/down controls, visibility icons | Per UI-SPEC component inventory |
| `vaul` (fallback only) | 1.1.2 | Bottom-sheet semantics if the hand-rolled Base UI sheet proves insufficient | React 19 peer-verified (`^19.0.0`) [VERIFIED: npm registry]; pulls `@radix-ui/react-dialog` into a Base-UI-only project — not stack-native, use only if needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled AST + contentEditable (recommended) | Tiptap v3 | Tiptap is battle-tested but replaces cell DOM with ProseMirror-managed content — violating D-11's "same tree" literal contract and permanently coupling the parity harness to Tiptap's DOM as templates evolve. Hand-rolled keeps ONE render path; execCommand formatting is deprecated-but-universal with the AST as the swap seam. **Escalate to Tiptap only if v1's 4-mark/1-list/1-link surface proves insufficient** (D-06 explicitly allows it; the AST shape is designed to be Tiptap-compatible) |
| Hand-rolled BottomSheet on Base UI Dialog (recommended) | `react-spring-bottom-sheet` 3.4.1 | LOCKED choice D-21, but **fails the stack**: peerDeps `react: '^16.14.0 || 17 || 18'` excludes React 19 (npm ERESOLVE) and it depends on react-spring v8 + @reach/portal + body-scroll-lock (all pre-React-19) [VERIFIED: npm registry]. D-21 authorizes the fallback |
| Hand-rolled BottomSheet on Base UI Dialog (recommended) | `vaul` | vaul is React-19-ready and feature-equivalent (snap points, drag handle, scroll lock) but depends on @radix-ui/react-dialog — a second component framework in a Base-UI-only project (components.json `registries: {}`, official-only). Use only if the Base UI sheet proves insufficient |
| Hand-rolled pointer DnD | `@dnd-kit` | For ONE vertical list, hand-rolled pointer tracking is ~100 lines; but keyboard accessibility, scroll-container math, and collision edge cases are exactly the don't-hand-roll class. dnd-kit is small, stable, React-19-verified |
| `execCommand` formatting (B/I/U/list) | Query-based selection API + manual range wrapping | execCommand is deprecated (MDN) but universally supported, handles undo-buffer preservation, and its output is normalized by our DOM→AST serializer. The AST is the contract — if execCommand dies, swap the engine without touching the model. Link requires manual range wrapping regardless of choice |

**Installation (this phase):**
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable
```
Everything else is in-repo or already installed. **No Tiptap, no react-spring-bottom-sheet, no vaul this phase.**

**Version verification (npm registry, 2026-08-10):** `@dnd-kit/core` 6.3.1 (2024-12-05), `@dnd-kit/sortable` 10.0.0 (2024-12-04), `@base-ui/react` ^1.7.0 installed, `dexie` 4.4.4 installed, `react` ^19.2.8 installed, `zod` 4.4.3 installed.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@dnd-kit/core` | npm | ~4 yrs (pkg), latest 2024-12 | 22.8M/wk | github.com/clauderic/dnd-kit | OK | Approved |
| `@dnd-kit/sortable` | npm | ~4 yrs (pkg), latest 2024-12 | 22.4M/wk | github.com/clauderic/dnd-kit | OK | Approved |
| `react-spring-bottom-sheet` | npm | 8 yrs (pkg), latest 2022-06 | 132K/wk | github.com/stipsan/react-spring-bottom-sheet | OK (legitimacy) / **REJECTED (compat)** | **Not installed** — React 19 peer-excluded |
| `vaul` | npm | ~3 yrs, latest 2024-12 | 38.7M/wk | github.com/emilkowalski/vaul | OK | Fallback only (Radix dep) |
| `@tiptap/react` | npm | 8 yrs, latest 2026-07-28 | 13.6M/wk | github.com/ueberdosis/tiptap | SUS (too-new signal on 3.29.2 publish) | Not installed this phase; if adopted, planner adds checkpoint:human-verify (signal is a false-positive artifact of a recent publish — 13.6M/wk, official repo, no postinstall) |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `@tiptap/react` — kept only as the documented escalation path; if the planner adopts it, gate behind `checkpoint:human-verify` and pin `3.29.2`.
**Compatibility rejections (not legitimacy):** `react-spring-bottom-sheet` 3.4.1 — `peerDependencies: { react: '^16.14.0 || 17 || 18' }` [VERIFIED: npm registry] excludes React 19.2; deps include react-spring `^8.0.27`, @reach/portal, body-scroll-lock, xstate 4 — all pre-React-19. D-21's built-in escape hatch ("fallback if it does not support the stack") is triggered.

## Architecture Patterns

### System Architecture Diagram

```
                        ┌──────────────────────────────────────────────────────┐
                        │  BUILDER SHELL (RenderBench → BuilderShell)          │
                        │  header: brand · undo/redo · Saved/Saving · pageSize │
                        │          · Print preview (BUIL-10)                    │
                        ├──────────────┬──────────────────────┬────────────────┤
                        │ LEFT RAIL    │ CENTER CANVAS        │ RIGHT RAIL     │
                        │ outline:     │  zoom wrapper (D-24) │ selected props │
                        │  · Header ✓  │  ┌────────────────┐  │ + document     │
                        │  · Bill to ✓ │  │ #print-root    │  │  settings      │
                        │  · Items(2)  │  │ (DocumentPage) │  │  (TemplateGallery
                        │    ⁃ item 1  │  │  edit attrs on │  │   BrandingPanel,
                        │    ⁃ item 2  │  │  same cells    │  │   page size)   │
                        │  · Totals ✓  │  │  (D-11)        │  │                │
                        │  · Footer ✓  │  └────────────────┘  │                │
                        │ visibility   │  ▲ overlay chrome    │                │
                        │ toggles(D-30)│  (rings/toolbar/    │                │
                        │ dnd reorder  │   drop inds) NEVER  │                │
                        │  (D-27)      │   inside #print-root │                │
                        └──────────────┴──────────────────────┴────────────────┘
                                        │  ▲                              │
                    ┌───────────────────┘  │                              │
                    ▼                      │ commit (blur/Enter)          │
        ┌────────────────────┐   AST    ┌──────────────────┐              │
        │ src/document (pure)│◄────────►│ EditorController │              │
        │ types.ts (Zod AST) │  model   │ (React layer)    │              │
        │ migrate/parse/serialize│        │ contentEditable   │            │
        │ money.ts · totals.ts│          │ cells · numeric   │            │
        └─────────┬──────────┘          │ filter · caret    │            │
                  │                    └────────┬───────────┘             │
                  │ put/get (repos seam)         │ snapshots (D-12)       │
                  ▼                              ▼                         │
        ┌──────────────────┐          ┌──────────────────┐   ┌────────────┐
        │ Dexie version(3) │          │ History (refs,   │   │ Autosave   │
        │ (D-29: upgrade   │          │  bounded 50)     │──►│ debounce   │
        │  v2 rows → AST)  │          │ undo/redo        │   │ ~800ms     │
        └──────────────────┘          └──────────────────┘   │ + status   │
                                                             └────────────┘
        Parity harness (tests/parity.spec.ts): captures #print-root ONLY —
        view goldens unchanged; new: edit-mode DOM == view DOM + no print artifacts
```

Data flow: user types in a cell → uncontrolled contentEditable DOM (React does not re-render while focused) → on blur/Enter the cell serializes DOM → AST → one model update → snapshot pushed to history (D-12) → debounced save to Dexie (D-15) → DocumentPage re-renders the same cells from the model (D-10). The print/PDF projections render the identical `#print-root` tree (ADR 0002).

### Recommended Project Structure

```
src/
├── document/            # PURE domain layer — no React/DOM/Dexie (Phase-2 rule)
│   ├── types.ts         # + richTextSchema, blockVisibility, settings, lineItem.image (v3)
│   ├── richtext.ts      # NEW: AST Zod schema (or in types.ts), serialize DOM→AST, parse AST→plain, plain→AST wrap
│   ├── migrate.ts       # NEW: migrateV2ToV3(doc): wraps legacy string fields → single-paragraph AST
│   └── money.ts         # unchanged — numeric commit conversion (D-09)
├── components/
│   ├── DocumentPage.tsx # THE render component — edit attrs layer on cells (D-11), hiddenBlocks skip (D-30), AST renderer for text
│   ├── BuilderShell.tsx # NEW: three-pane shell (evolved from RenderBench.tsx)
│   ├── OutlinePane.tsx  # NEW: 5 virtual blocks + line items, visibility toggles, dnd, collapse (D-25..D-28)
│   ├── PropertiesPane.tsx # NEW: selected-element props + document settings (moved gallery/branding)
│   ├── edit/            # NEW: editing chrome + controllers
│   │   ├── RichTextCell.tsx   # uncontrolled contentEditable, commit-on-blur, execCommand formatting
│   │   ├── NumericCell.tsx    # filtered contentEditable + money parse + invalid popover (D-09)
│   │   ├── FloatingToolbar.tsx# B/I/U/list/link shell overlay (D-04/D-08)
│   │   └── useHistory.ts      # bounded model-snapshot history (no useEffect)
│   ├── BottomSheet.tsx  # NEW: Base UI Dialog-based (D-21 fallback)
│   └── ui/popover.tsx   # ADD via shadcn official registry (only new block)
├── db/
│   ├── db.ts            # + db.version(3).stores(same).upgrade(migrate) (D-29)
│   └── repos.ts         # unchanged seam; autosave calls documentsRepo.put
├── routes/index.tsx     # bench route → builder route
└── lib/useMountEffect.ts # unchanged
tests/
├── parity.spec.ts       # + edit-mode DOM == view DOM, print no-artifacts, rich-text fixture goldens
├── unit (src/document/__tests__/) # richtext.test.ts, migrate.test.ts, history.test.ts, numeric.test.ts
└── persistence.spec.ts  # + version(3) upgrade round-trip (seed v2 rows → open → v3 shape)
```

### Pattern 1: Uncontrolled contentEditable with commit-on-blur (the D-01/D-10/D-11 core)

**What:** The cell renders the AST as ordinary React elements (the SAME tree the view renders). The container gets `contentEditable` + `suppressContentEditableWarning`. While focused, the cell is **uncontrolled** — React never re-renders it from the model, so React cannot clobber the caret. On blur/Enter, serialize the cell DOM → AST, commit to the model, and let the model re-render (keyed by field, D-10). On Escape, drop the DOM edit and re-render from the model.
**When to use:** every rich-text and numeric cell on the canvas. This is the D-11 literal contract — edit attrs on the same cells, same tree, same text; the parity harness assertion becomes a tautology enforced by construction.

```tsx
// Sketch — RichTextCell (see Code Examples for the full contract)
function RichTextCell({ ast, onCommit }: { ast: RichTextAST; onCommit: (ast: RichTextAST) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const commit = () => {
    if (ref.current) onCommit(domToAst(ref.current)) // serialize → model → re-render
  }
  // While focused: NO re-render from model (uncontrolled). Re-render happens only on commit,
  // when the caret is gone (blur) — so caret jumps cannot occur (D-10).
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); /* drop edit: re-render from model */ } }}
    >
      <AstView ast={ast} /> {/* same renderer the view/print use */}
    </div>
  )
}
```

### Pattern 2: Model-snapshot history + debounced auto-save (D-12..D-18) — zero useEffect

**What:** History is two ref-held stacks plus the model state. Every committed edit (blur/Enter/CRUD/reorder/template/branding/pageSize) pushes a deep clone of the *previous* model onto `past` (bounded 50, D-14) and clears `future`. undo/redo pop/push and set the model. Auto-save is a ref-held timer: any commit calls `scheduleSave(next)` which resets a 800ms timer; when it fires, `documentsRepo.put` and set save state `'saving' → 'saved'`; failure sets `'failed'` (toast + badge, model kept, D-17). Keyboard shortcuts bind to the builder root's `onKeyDown` — no window listeners, no useEffect.
**When to use:** all undo/redo + autosave wiring. This satisfies the house rule (no direct useEffect) by construction.

### Pattern 3: Dexie version(3) as a pure data migration

**What:** `db.version(3).stores({ ...same five schema strings... }).upgrade(trans => trans.table('documents').toCollection().modify(migrateV2ToV3))` — the schema strings are UNCHANGED (no new indexes: `settings` and line-item `image` are fields, not indexes); the version bump alone triggers the upgrade callback. `migrateV2ToV3` lives in `src/document/migrate.ts` (pure, React-free) and wraps every legacy string field into `{ type: 'paragraph', content: [{ type: 'text', text }] }`. Because a single-paragraph/single-text AST renders pixel-identical to the old string, the existing golden baselines stay green and PROVE the migration is visually lossless.
**When to use:** the D-29 migration; also reused at the import boundary decision (see Open Questions: envelope version).

### Pattern 4: Overlay chrome keyed to bounding rects (D-04)

**What:** All editing chrome (selection ring, hover outline, floating toolbar, drop indicator, drag handles) renders as absolutely-positioned elements in the builder shell, keyed to editable-cell `getBoundingClientRect()` via refs. Nothing renders inside `#print-root`; `print.css` already hides builder chrome. The floating toolbar renders only while a rich cell is focused with a selection, flips below on viewport clip, and hides on blur (UI-SPEC §Editing Chrome Overlay Contract).
**When to use:** every piece of editing chrome. This is what makes "print projection has no editing artifacts" a spec assertion rather than a hope.

### Anti-Patterns to Avoid
- **Re-rendering a focused contentEditable from model state:** React reconciliation rewrites the DOM under the caret and the caret jumps / typing dies. Never update a focused cell's props from the model; keep it uncontrolled until blur.
- **`dangerouslySetInnerHTML` for rich text:** banned project-wide (grep-enforced in CI, DocumentPage.tsx:21-22 comment). AST → React elements only.
- **`useEffect`-driven save/history:** the house rule bans it and it causes save-on-mount/cleanup bugs. Use refs + event handlers (Pattern 2).
- **Switching on `model.template` in the renderer:** Phase-3 Anti-Pattern 1 — the AST renderer must be template-agnostic (renders marks; templates style them via tokens).
- **Rich-text cells with default paragraph margins:** a wrapped AST rendering `<p>` with default margins shifts every layout → golden drift. The paragraph renderer must be `margin: 0` (block without spacing), identical to the current text-node rendering.
- **Pasting rich HTML into contentEditable:** browsers inject arbitrary DOM (spans, font tags, nested divs) that breaks the serializer. v1 policy: intercept paste, strip to plain text, insert as text (formatting is toolbar-driven per D-08).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reorder (desktop line items) | Pointer-tracked custom DnD | `@dnd-kit/core` + `@dnd-kit/sortable` | Keyboard accessibility, touch sensors, scroll-container collision math, and drop animations are a trap; dnd-kit is the standard, React-19-verified, 22M downloads/wk |
| Modal/dialog plumbing (focus trap, Escape, aria-hidden, backdrop) | Custom portal + focus management | Base UI Dialog primitives (already wrapped in `src/components/ui/dialog.tsx`) | Focus trapping and a11y are notoriously buggy when hand-rolled; Base UI is stack-native and the wrapper exists |
| Money conversion for numeric cells | Floats / ad-hoc parsing | `src/document/money.ts` primitives (minor units + CURRENCY_DECIMALS) | Phase-2 locked: integer minor units, never bare floats (PITFALLS.md:232); LINE-03 totals must never go out of sync |
| Schema validation of the AST + model | Ad-hoc type guards | Zod 4 (in-repo) | Source-of-truth schemas are the Phase-2 pattern; z.infer derives types; JSON-safe by construction (D-06) |

**Key insight:** the AST is the seam, not the engine. The model stores a Zod-validated node-array AST (D-06); the editing engine under it (contentEditable + execCommand, or Tiptap later) is replaceable without touching schema, fixtures, IO, renderer, or parity. This is what makes the risky D-01/D-06 choices reversible at the engine level. What is NOT replaceable cheaply is the AST shape itself — hence the one-way flags on D-06/D-07/D-29.

## Runtime State Inventory

> Migration phase (D-29: Dexie version(3) rewrites stored documents). The canonical question — *after every file in the repo is updated, what runtime systems still hold the old shape?*

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | IndexedDB `paperchaser` DB, `documents` table: stored documents (v2 shape — plain-string text fields; the `demo-invoice` seed row exists in real browsers that used the app) | **Data migration** — `db.version(3).upgrade(trans => table('documents').toCollection().modify(migrateV2ToV3))` rewrites each row's text fields to single-paragraph ASTs at DB open (D-29). Same migration reused as the import-boundary decision (see Open Questions). Persistence spec must seed v2-shaped rows and assert the v3 read |
| Live service config | None — local-first SPA, no external services | None |
| OS-registered state | None — no daemons, task schedulers, or OS registrations | None |
| Secrets/env vars | None — no env secrets in this phase; Dexie DB name `'paperchaser'` unchanged (db.ts:10) | None |
| Build artifacts | None — no compiled artifacts or global installs reference the model shape | None |

**Stored-data nuance (verified shape):** `db.version(2).stores({ documents: 'id, type, status, updatedAt' })` [VERIFIED: src/db/db.ts:16-21] — the v3 schema strings stay identical (no index changes), so the version bump is a pure data migration. `documentsRepo` is the only Dexie touchpoint (repos.ts:2-5 comment) — the migration function is imported by db.ts, not repos.

## Common Pitfalls

### Pitfall 1: React reconciliation clobbers focused contentEditable content
**What goes wrong:** typing in a cell that re-renders from state on every keystroke loses characters, the caret jumps to the start, or the cell goes dead.
**Why it happens:** React re-renders and rewrites children of the focused editable element (the classic controlled-contentEditable footgun).
**How to avoid:** uncontrolled cells (Pattern 1) — no model update and no prop change while focused; serialize + commit on blur/Enter only. Cells keyed by field (D-10) so re-render after commit is a clean remount.
**Warning signs:** Playwright typing test loses characters; caret reset observed manually.

### Pitfall 2: execCommand output drifts from the AST serializer's expectations
**What goes wrong:** `execCommand('bold')` may insert `<b>` in one browser and `<strong>` in another; lists may come back as `<ul><li>` with stray `<br>` or `<div>`; pasted content injects spans.
**Why it happens:** contentEditable DOM is browser-authored, not schema-constrained.
**How to avoid:** the DOM→AST serializer normalizes by tag-name mapping (`b`/`strong` → bold mark, `i`/`em` → italic, `u` → underline, `ul>li` → list, `a` → link) and collapses whitespace; strip rich HTML on paste (v1 policy); unit-test the serializer against a matrix of browser-shaped DOM strings (fixture strings, not real browsers).
**Warning signs:** goldens drift after formatting a torture-fixture cell; serializer unit tests reveal unexpected tags.

### Pitfall 3: Paragraph margins shift the print layout → golden drift on EVERY template
**What goes wrong:** wrapping plain strings in `{type:'paragraph'}` and rendering `<p>` with default margins adds ~1em vertical space to every cell — the golden baselines (7 templates × preview/print/PDF) all fail.
**Why it happens:** the AST renderer reuses browser default styles instead of the zero-spacing the current text-node rendering has.
**How to avoid:** the paragraph node renders with `margin: 0` (and inherits the cell's font metrics exactly as today); the single-paragraph/single-text case must be pixel-identical to the plain string (this is the migration's losslessness proof).
**Warning signs:** first baseline run after the AST renderer lands shows diff > 0.005 on every template.

### Pitfall 4: Dexie upgrade that looks like a no-op
**What goes wrong:** developer "simplifies" `db.version(3)` away because the schema strings are identical to v2, or forgets the `.upgrade()` callback — stored v2 documents then load with string fields that fail the new `documentSchema.parse`.
**Why it happens:** the v3 change is data-shaped (field types), not schema-shaped (indexes), so the version bump is easy to dismiss.
**How to avoid:** keep `db.version(3).stores({ ...same strings... })` explicitly (the version bump is what triggers the upgrade callback — Dexie upgrade semantics), and add a persistence-spec test: seed a v2-shape row via fake-indexeddb, open the DB, assert the row reads back as v3 AST shape.
**Warning signs:** app boots but `documentsRepo.get` returns rows that fail schema validation; the demo document renders raw `[object Object]`.

### Pitfall 5: React 19 peer-dependency failure on install
**What goes wrong:** `pnpm add react-spring-bottom-sheet` fails with ERESOLVE against react 19.2.8 (peer range `^16.14 || 17 || 18`), or succeeds only with `--force` and breaks at runtime.
**Why it happens:** the package pre-dates React 19 and its transitive stack (react-spring v8, @reach/portal) is not React-19-ready.
**How to avoid:** use the D-21 fallback (Base UI Dialog BottomSheet) — do not force-install. Document this in the plan so no executor "helpfully" force-installs.
**Warning signs:** install logs mention ERESOLVE/peer conflicts; package versions pinned to pre-2023 majors.

### Pitfall 6: Edit-mode harness that screenshots editing chrome
**What goes wrong:** the extended parity spec captures the canvas while a floating toolbar/ring is visible and the golden diff fails spuriously.
**Why it happens:** chrome is overlay-positioned near the captured element.
**How to avoid:** capture `#print-root` only (element box, as today — parity.spec.ts:30-33), blur before capture, and assert chrome absence structurally (no `[data-editing]` elements inside `#print-root`, placeholder text absent in print media).
**Warning signs:** flaky diffs that vanish when the mouse moves.

## Code Examples

### Dexie version(3) upgrade (D-29)
```typescript
// Source: dexie.org/docs/Version/Version.upgrade() — transaction.table().toCollection().modify pattern
db.version(3).stores({
  company: 'id',
  customers: 'id, name',
  catalog: 'id, name',
  documents: 'id, type, status, updatedAt', // identical to v2 — version bump alone triggers upgrade
  preferences: 'key',
}).upgrade((trans) => {
  return trans.table('documents').toCollection().modify((doc) => {
    migrateV2ToV3(doc) // pure fn from src/document/migrate.ts — wraps string fields → single-paragraph AST
  })
})
```

### AST shape (Zod-validated, React-free) — the model contract (D-06/D-08)
```typescript
// src/document/types.ts (shape sketch — planner pins exact Zod)
const richTextMarkSchema = z.object({
  type: z.enum(['bold', 'italic', 'underline', 'link']),
  attrs: z.object({ href: z.string().refine(isSafeHref) }).optional(), // link only — http/https/mailto, no javascript:
})
const richTextNodeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string(), marks: z.array(richTextMarkSchema).optional() }),
  z.object({ type: z.literal('paragraph'), content: z.array(z.lazy(() => richTextNodeSchema)) }),
  z.object({ type: z.literal('list'), content: z.array(z.lazy(() => listItemSchema)) }),
])
// A stored text field is a single-paragraph AST: { type: 'paragraph', content: [{ type: 'text', text: 'plain' }] }
// Legacy string → AST wrap keeps goldens byte-identical (Pitfall 3).
```

### Numeric cell commit via money primitives (D-09)
```typescript
// Source: src/document/money.ts — CURRENCY_DECIMALS registry is the single source for dp
const dec = CURRENCY_DECIMALS[model.currency] // 2 for EUR, 0 for JPY [VERIFIED: src/document/money.ts:9]
// commit: rawString → roundMinor(Number(rawString), dec) → minor units (never floats)
// JPY 0dp: "1,5" → invalid → popover "Enter a valid number." (UI-SPEC error contract)
```

### History + autosave (D-12..D-18) — no useEffect
```typescript
// Sketch — useHistory + ref-held debounce (event-handler driven, house-rule compliant)
const past = useRef<DocumentModel[]>([])
const future = useRef<DocumentModel[]>([])
const [model, setModel] = useState(initial)
const timer = useRef<ReturnType<typeof setTimeout>>()
const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed'>('saved')

const commit = (next: DocumentModel) => {
  past.current = [...past.current.slice(-49), model] // push previous, bound 50 (D-14)
  future.current = []
  setModel(next)
  scheduleSave(next)
}
const scheduleSave = (next: DocumentModel) => { // debounced write ~800ms (D-15)
  clearTimeout(timer.current)
  timer.current = setTimeout(async () => {
    setSaveState('saving')
    try { await documentsRepo.put(next); setSaveState('saved') }
    catch { setSaveState('failed') } // toast + badge; model never discarded (D-17)
  }, 800)
}
const undo = () => {
  const prev = past.current.pop(); if (!prev) return
  future.current.push(model); setModel(prev)
}
// onKeyDown on the builder root: Ctrl/Cmd+Z → undo; Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y → redo (D-18)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Overlay input fields for canvas editing | contentEditable in place (WYSIWYG cells) | D-01 locked this phase | True WYSIWYG; requires careful React/caret handling (Pattern 1) |
| HTML-string rich text | JSON AST (ProseMirror/Tiptap-style) in the model | D-06 locked this phase | JSON-safe, Zod-validated, no HTML-injection surface; enables future Tiptap adoption unchanged |
| Per-keystroke write-through persistence (RenderBench.tsx:186-208) | Debounced (~800ms) auto-save + save-state indicator | D-15/D-16 this phase | Fewer writes, visible save state, failure-safe (D-17) |
| Command-pattern undo | Whole-model snapshot undo | D-12 this phase | Simpler, covers every model change (D-13), bounded 50 (D-14) |
| Desktop-only assumption | Single <1024px mobile breakpoint with bottom sheets + sticky preview | D-19..D-24 this phase | Same editing actions on touch (BUIL-02) |
| react-spring-bottom-sheet (2022, pre-React-19) | Base UI Dialog-based bottom sheet | 2022 → this phase | react-spring-bottom-sheet cannot install on React 19 (peer range excludes it) |

**Deprecated/outdated:**
- **`document.execCommand` (formatting):** formally deprecated by MDN, but — per MDN — "there are still some valid use cases that do not yet have viable alternatives. For example, unlike direct DOM manipulation, modifications performed by execCommand() preserve the undo buffer" [CITED: developer.mozilla.org/en-US/docs/Web/API/Document/execCommand]. Use for B/I/U + insertUnorderedList in v1; the AST is the seam if it is ever removed.
- **`react-spring-bottom-sheet`:** unmaintained since 2022 (latest publish 2022-06-01), pre-React-19 stack. Rejected on the D-21 escape hatch.
- **`@dnd-kit/core` 6.x classic API:** still the standard (22M downloads/wk); the repo's README now documents a v2 architecture (`@dnd-kit/dom` + `@dnd-kit/react`) — the classic `@dnd-kit/core`/`sortable` line remains the stable, fully documented choice for this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | D-07's "every text node / labels" is scoped to **model-data prose fields** (company name/address/email, customer name/address, line item title/description, shipping/fee label); **structured identifiers** (`number`, `issueDate`) and **template-structural labels** (column headers "Item/Qty/Unit price", "Bill to", "Subtotal/Tax/Grand total", DOC_TITLES, footer boilerplate) stay plain/static | Standard Stack / Runtime State Inventory | If the user intended structural labels editable, the migration + renderer surface grows significantly and template text moves into the model — a bigger schema change than planned. Needs confirmation |
| A2 | `document.execCommand` will remain supported in all evergreen browsers for the life of v1 (deprecated, no replacement; universal support today) [CITED: MDN] | Code Examples / State of the Art | If a browser drops it, the formatting engine must be swapped (selection-API based) — the AST contract survives |
| A3 | The hand-rolled AST (paragraph/text/listItem + 4 marks) is small enough to own at ~300-500 pure lines; Tiptap adoption later is a drop-in because the AST mirrors ProseMirror JSON | Summary / Standard Stack | If editing edge cases (IME, complex lists, deep nesting) exceed expectations, the escalation path is Tiptap — cost is a focused swap of the cell component, not the model |
| A4 | Dexie runs the `.upgrade()` callback on version bump even when the `stores()` schema strings are identical to the previous version | Code Examples / Pitfall 4 | If Dexie skipped identical-schema upgrades, stored docs would not migrate and schema parse would fail — mitigated by a persistence-spec test that seeds v2 rows and asserts the v3 read (the spec makes the assumption checkable) |
| A5 | Base UI (^1.7.0) has no Drawer/Sheet primitive, so the mobile bottom sheet is built on Base UI Dialog + custom slide-up CSS | Standard Stack | If Base UI ships a Drawer, prefer it; the UI-SPEC contract is library-agnostic |
| A6 | Block-id enum values are spelled `'header' | 'billTo' | 'items' | 'totals' | 'footer'` matching the five virtual outline entries (D-25/D-27) | Open Questions / Model | Exact casing/values must be pinned by the planner/executor; renderer + outline + settings schema must agree |
| A7 | Envelope `version` stays at 1 and old string-shaped exports are handled by rejecting them (recommended) OR by importing through the v2→v3 migration — decision flagged in Open Questions | Open Questions | A wrong call either breaks old import files silently or bloats the boundary — flagged for the planner |
| A8 | The edit-mode parity assertion (D-11) captures `#print-root` while unfocused, so edit attrs present but no chrome/caret — visual equality with the view goldens | Common Pitfalls 6 | If the harness must assert mid-edit state, it needs a real typing interaction — more complex spec; recommend unfocused capture |

## Open Questions

1. **D-07 scope: are template-structural labels (column headers, "Bill to", totals labels, DOC_TITLES, footer boilerplate) editable rich text?**
   - What we know: D-07 says "every text node… including names, addresses, and labels". The model's prose fields are enumerated (A1). Structural labels are hardcoded JSX in DocumentPage.tsx:147-196 and the print presets.
   - What's unclear: whether "labels" means model label fields (shipping/fee labels) or the template's column/section headings.
   - Recommendation: model-prose fields only (A1); structural labels are template-owned (consistent with D-26 "structure fixed by convention"). **Confirm with the user in discuss/planning** — this is the largest scope question in the phase.
2. **Export envelope version (io.ts): bump to 2 or coerce legacy strings at the import boundary?**
   - What we know: `envelopeSchema.version` is `z.literal(1)` [VERIFIED: src/document/io.ts:20-24]; after the AST change, a v1-exported JSON with string fields fails `documentSchema` parse (type mismatch), and io.ts's doctrine is "never coerces".
   - What's unclear: whether any real v1 exports exist (pre-release — likely none).
   - Recommendation: bump the envelope to `version: 2` and reject v1 exports as `invalid_envelope` (clean boundary, honest signal). If the planner prefers seamless old-file import, route them through `migrateV2ToV3` at the boundary instead — either way, decide explicitly and test it.
3. **Mobile spec (D-19) scope for the researcher/planner handoff:**
   - What we know: the interaction contract is fixed (UI-SPEC §Mobile Interaction Contract: top header + sticky fit-width preview + editor surface below; tapping a block opens a bottom sheet; up/down reorder; numeric popover inside the sheet row; save-failure toast below the header).
   - What's unclear: the detailed mobile screen inventory (which fields appear in each sheet, exact sheet heights/snap points, keyboard-resize behavior).
   - Recommendation: the 04-MOBILE-SPEC.md artifact (D-19) is produced during planning — this research confirms every interaction has a verified stack primitive (Base UI Dialog sheet, sticky preview = same DocumentPage at fit-width, up/down = plain buttons). Real-device QA remains a STATE.md blocker item for execution.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | ✓ | v24.12.0 | — |
| pnpm | install (CI uses `pnpm install --frozen-lockfile`) | ✓ | 11.20.0 | — |
| Playwright + chromium | parity harness (tests/parity.spec.ts) | ✓ | 1.62.1 (chromium-1228/1234) | — |
| vitest | unit tests | ✓ | 4.1.10 | — |
| fake-indexeddb | persistence/migration unit tests | ✓ | 6.2.5 | — |
| IndexedDB (browser) | runtime storage + version(3) migration | ✓ (Chromium) | native | — |

**Missing dependencies with no fallback:** none — the phase is code-only on the proven Phase 1-3 toolchain.

## Validation Architecture

> workflow.nyquist_validation is `true` (.planning/config.json) — included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.10 (unit, scoped to `src/**/*.test.ts` per Phase-2 decision) + @playwright/test 1.62.1 (parity, `tests/parity.spec.ts`) |
| Config file | none new — vite.config.ts include + passWithNoTests (Phase-2), existing playwright config |
| Quick run command | `pnpm vitest run src/document/__tests__/richtext.test.ts` |
| Full suite command | `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test` (CI baseline) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUIL-01/03/06 | Three-pane shell renders; canvas cells editable in place | e2e (playwright) | parity-style spec asserting `[contenteditable]` cell count + shell panes | ❌ Wave 0 |
| BUIL-03 (D-11) | Edit-mode `#print-root` DOM == view-mode `#print-root` DOM (attrs aside) | e2e (playwright) | extended `tests/parity.spec.ts` — golden diff of edit-mode capture (unfocused) + structural equality | ❌ Wave 0 |
| BUIL-03 (D-08) | Rich-text formatting round-trips: DOM → AST → render (bold/italic/underline/list/link) | unit | `vitest run src/document/__tests__/richtext.test.ts` | ❌ Wave 0 |
| D-07/D-29 | `migrateV2ToV3` wraps every legacy string field; lossless (plain AST renders identical) | unit | `vitest run src/document/__tests__/migrate.test.ts` | ❌ Wave 0 |
| D-29 | Dexie version(3) upgrade rewrites stored v2 rows to v3 shape | unit (fake-indexeddb) | extend `tests/persistence.spec.ts` (seed v2 row → open → assert v3) | ❌ Wave 0 |
| BUIL-07 (D-12..14) | History: push-on-commit, bounded 50, undo/redo, redo cleared on new commit | unit | `vitest run src/document/__tests__/history.test.ts` | ❌ Wave 0 |
| BUIL-08 (D-15..17) | Debounced save fires ~800ms after last commit; failure keeps model + sets failed state | unit (fake timers) | `vitest run src/document/__tests__/autosave.test.ts` | ❌ Wave 0 |
| D-09 | Numeric cells: filter, parse-to-minor-units (EUR 2dp, JPY 0dp), invalid → popover, Escape cancels | unit | `vitest run src/document/__tests__/numeric.test.ts` | ❌ Wave 0 |
| BUIL-04/05 (D-23) | Reorder logic (move up/down + dnd handler produces correct item order) | unit | reorder-pure-fn test in history/reorder test | ❌ Wave 0 |
| BUIL-09 | Zoom transform stays screen-only (print media has no transform) | e2e (playwright) | print capture with zoom set == golden (transform absent) | ❌ Wave 0 |
| D-11 | Print projection has no editing artifacts (no placeholder, no caret, no chrome) | e2e (playwright) | extended parity spec — print-media capture with builder open, assert absence structurally | ❌ Wave 0 |
| LINE-01 | Optional image: data:-URL only (T-02-02 refine), renders in table cell | unit + e2e | schema unit test + fixture golden | ❌ Wave 0 |
| D-30 | Hidden block skipped on canvas AND print; persists across reload | unit + e2e | renderer unit + persistence round-trip | ❌ Wave 0 |
| Regression | All 7-template goldens stay green after AST wrapping (losslessness proof) | e2e (playwright) | existing `tests/parity.spec.ts` — UNCHANGED goldens must pass | ✅ existing |

### Sampling Rate
- **Per task commit:** `pnpm vitest run` (scoped to touched test files)
- **Per wave merge:** `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build`
- **Phase gate:** full CI baseline green (incl. `pnpm test` parity) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/document/__tests__/richtext.test.ts` — AST serialize/parse/render + serializer matrix (covers BUIL-03/D-08)
- [ ] `src/document/__tests__/migrate.test.ts` — v2→v3 field wrapping + losslessness (covers D-07/D-29)
- [ ] `tests/persistence.spec.ts` extension — version(3) upgrade round-trip via fake-indexeddb (covers D-29)
- [ ] `src/document/__tests__/history.test.ts` + `autosave.test.ts` + `numeric.test.ts` — undo/redo, debounce, numeric cells
- [ ] `tests/parity.spec.ts` extension — edit-mode DOM == view DOM, print no-artifacts, rich-text torture fixture goldens (covers D-11)
- No framework install needed — vitest + playwright + fake-indexeddb all present.

## Security Domain

> security_enforcement is `true` (ASVS L1) — included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (local-first SPA, no accounts) |
| V3 Session Management | no | — |
| V4 Access Control | no | — (single-user local storage) |
| V5 Input Validation | **yes** | Zod 4 schemas at every boundary: rich-text AST, block-visibility settings, line-item image, numeric cells (money.ts minor units) |
| V6 Cryptography | no | — (no secrets; local IndexedDB) |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| HTML injection via rich text (stored XSS on render) | Tampering | AST → React elements only; **`dangerouslySetInnerHTML` banned project-wide (grep-enforced in CI**, DocumentPage.tsx:21-22); React text nodes escape by default; the AST Zod schema rejects unknown node/mark types (z.object strips unknowns but the renderer only handles the 4 node types + 4 marks) |
| `javascript:` URL in a link mark | Tampering | link mark `href` refined via Zod to http/https/mailto (reuse the T-02-02 data:-URL refine pattern from `logoSchema` [VERIFIED: src/document/types.ts:49-54]); never rendered as-is into `href` without the refine |
| Arbitrary DOM from rich paste (deserializer bypass) | Tampering | v1 paste policy: strip to plain text before insert; serializer is a whitelist (known tags → marks), never a pass-through |
| Remote content fetch via pasted/edited URLs or images | Information disclosure | Line-item image reuses the data:-URL-only `logoSchema` constraint (T-02-02 — no external http(s) image URLs); link marks restricted to http/https/mailto |
| Oversized document / AST depth (DoS) | DoS | Existing `MAX_JSON_LENGTH` import cap (io.ts:35); AST depth is naturally bounded by the flat node-array shape (lists nest one level) — no unbounded recursion in serialize/parse |
| Save-failure data loss | — (reliability) | D-17: in-memory model never discarded; toast + "Not saved" badge + Retry |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — `npm view <pkg> version peerDependencies dependencies` for @tiptap/react 3.29.2 (`react ^17||^18||^19`), react-spring-bottom-sheet 3.4.1 (`react ^16.14||17||18` + react-spring v8/@reach/portal/body-scroll-lock deps), vaul 1.1.2 (`react ^19`), @dnd-kit/core 6.3.1 / @dnd-kit/sortable 10.0.0 (`react >=16.8`), dexie 4.4.4
- [VERIFIED: in-repo reads this session] — `src/document/types.ts` (lineItemSchema :32-43, logoSchema :49-54, documentSchema :87-112), `src/db/db.ts` (version(2) stores :16-21), `src/db/repos.ts` (documentsRepo, DEMO_DOCUMENT_ID :51), `src/components/DocumentPage.tsx` (`#print-root` :133, hardcoded cell text :147-196), `src/components/RenderBench.tsx` (write-through :186-208), `src/document/money.ts` (CURRENCY_DECIMALS :9), `src/document/io.ts` (envelope `version: z.literal(1)` :20-24), `src/lib/useMountEffect.ts`, `src/components/ui/dialog.tsx` (Base UI Dialog import :3), `tests/parity.spec.ts` (capture :164-189, thresholds), `.planning/config.json` (nyquist_validation: true, security_enforcement: true), `.github/workflows/ci.yml`
- [VERIFIED: gsd-tools package-legitimacy] — verdicts: @dnd-kit/* OK, react-spring-bottom-sheet OK, vaul OK, @tiptap/* SUS (too-new signal)
- tiptap.dev/docs/editor/getting-started/install/react — useEditor/EditorContent, getJSON/setContent, BubbleMenu/FloatingMenu, useEditorState (escalation-path reference)
- dexie.org/docs/Version/Version.upgrade() — `version.upgrade(trans => trans.table(...).toCollection().modify(...))` migration pattern

### Secondary (MEDIUM confidence)
- developer.mozilla.org/en-US/docs/Web/API/Document/execCommand — deprecated but "valid use cases… preserve the undo buffer" (formatting engine rationale)
- github.com/clauderic/dnd-kit README — v2 architecture (@dnd-kit/dom + @dnd-kit/react) alongside the classic stable core/sortable line
- github.com/stipsan/react-spring-bottom-sheet README — snap points/header/footer/scrollLocking/a11y API surface (contract reference for the Base UI fallback)

### Tertiary (LOW confidence)
- Training knowledge on contentEditable + React reconciliation footguns (Pitfall 1) — standard practice, unverified by a live browser test this session; the edit-mode parity spec is the enforced safety net

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — registry-verified versions/peer-deps for every package decision; in-repo verification of all touched seams
- Architecture: **MEDIUM** — the AST/contentEditable design is grounded in the locked decisions and in-repo reads, but the hand-rolled editor controller is novel code; the edit-mode parity extension is the mitigation (A3)
- Pitfalls: **MEDIUM** — contentEditable/execCommand pitfalls are established industry knowledge, verified by citation (MDN) but not by live browser testing this session

**Research date:** 2026-08-10
**Valid until:** 2026-09-09 (30 days — stack is stable; re-verify @dnd-kit/dom v2 and Base UI Drawer availability before planning if longer)
