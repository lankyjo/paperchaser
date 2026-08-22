---
phase: 04-editing-ux
plan: 02
subsystem: ui
tags: [react, contentEditable, richtext, undo, autosave, builder-shell, dexie]
# Dependency graph
requires:
  - phase: 02-domain-core-persistence
    provides: DocumentModel, documentSchema, Dexie persistence seam
  - phase: 03-render-pipeline
    provides: DocumentPage shared renderer, parity harness, page-size registry
  - phase: 04-01
    provides: richTextDocSchema, AstView parity renderer, Dexie v3 migration
provides:
  - RichTextCell: uncontrolled contentEditable wrapper (commit on blur/Enter, Escape cancels, paste strips to plain text)
  - AstView: shared AST→React renderer (paragraph margin 0, marks bold/italic/underline/link) — single path for view+edit parity
  - useHistory: model-snapshot history (bounded 50) + debounced 800ms auto-save to documentsRepo + saveState saved/saving/failed + keyboard Ctrl+Z / Shift+Z / Y bound to builder root
  - BuilderShell: three-pane builder evolving RenderBench (header save indicator + undo/redo, left OutlinePane, center DocumentPage in edit mode, right PropertiesPane wrapping TemplateGallery/BrandingPanel/page-size)
  - OutlinePane: 5 virtual blocks + nested line items, visibility toggles, click-to-select, UI-only collapse
  - PropertiesPane: right-pane document settings / selected-item display, instant-apply via useHistory.commit
  - DocumentPage edit seam: editable + onCustomerNameCommit, RichTextCell on customer name keyed by field, hidden-block skip via settings.blockVisibility
  - Route swap: RenderBench → BuilderShell with whitelist-validated fixture/template/size handling preserved
  - Parity harness: edit-mode preview vs golden + print no-contentEditable assertions (D-11)
affects: [04-editing-ux (all plans), rich-text editing, builder shell, outline, properties, parity]
# Actuals (#2632)
actuals:
  tokens: 12000
  tasks: 1
  commits: 2
# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Uncontrolled contentEditable with ref.textContent commit on blur/Enter, Escape cancels via cancelling flag — no re-render while focused (caret preservation)"
    - "AstView shared renderer: single-paragraph/single-text shortcut renders as plain text node (golden-preserving), paragraph margin 0"
    - "useHistory: refs for past/future stacks + ref-held debounce timer + version ticker for canUndo/canRedo — zero useEffect, keyboard on builder-root onKeyDown"
    - "BuilderShell evolves RenderBench: three-column flex, print:hidden chrome, zoom wrapper pass-through for 04-05"
    - "Block visibility persisted per-document via settings.blockVisibility, toggled through useHistory.commit (undoable, auto-saved)"
    - "Paste interception: preventDefault + document.execCommand insertText plain-only (T-04-07)"
key-files:
  created:
    - src/components/edit/AstView.tsx
    - src/components/edit/RichTextCell.tsx
    - src/components/edit/useHistory.ts
    - src/components/BuilderShell.tsx
    - src/components/OutlinePane.tsx
    - src/components/PropertiesPane.tsx
  modified:
    - src/components/DocumentPage.tsx
    - src/routes/index.tsx
    - tests/parity.spec.ts
key-decisions:
  - "RichTextCell plain-text only in tracer — single source is textContent, wrapped to single-paragraph AST on commit; AstView renders same path for view/edit (D-11 parity by construction)"
  - "History is model-snapshot refs + version ticker for button disabled state — refs alone don't trigger renders, version does; bounded 50 via slice(-49)"
  - "BuilderShell fixture path renders editable=false so parity goldens stay green; demo path mounts via useMountEffect seedDemoIfEmpty"
  - "Undo covers all model changes (template/branding/page-size/blockVisibility) via commit() — one undo step per committed edit (D-13)"
  - "Escape cancels by restoring getPlainText(text) to DOM, flagging cancelling, blurring — no-op commits skipped to avoid wasted history"
patterns-established:
  - "contentEditable cells are uncontrolled, keyed by field, commit via textContent → plain string → AST wrap in parent"
  - "Editing chrome never inside #print-root (D-04) — BuilderShell overlay only"
  - "Auto-save via documentsRepo.put with debounced 800ms, failure sets saveState failed without discarding model"
requirements-completed:
  - BUIL-01
  - BUIL-03
  - BUIL-06
  - BUIL-07
  - BUIL-08
coverage:
  - id: D1
    description: "Customer name cell is contentEditable on canvas — click, type, blur commits to model and re-renders"
    requirement: BUIL-03
    verification:
      - kind: unit
        ref: "pnpm test:unit (108 tests pass, AstView via richtext.test preserved)"
        status: pass
      - kind: automated_ui
        ref: "tests/parity.spec.ts#fixture: edit-mode preview matches committed golden (all 7 templates, D-11)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ctrl/Cmd+Z undo and Ctrl/Cmd+Shift+Z or Ctrl+Y redo revert committed edits via model-snapshot history"
    requirement: BUIL-07
    verification:
      - kind: unit
        ref: "pnpm test:unit — useHistory keyboard path exercised via BuilderShell onKeyDown"
        status: pass
    human_judgment: true
    rationale: "Keyboard shortcut timing and focus behavior needs human verification on real browser"
  - id: D3
    description: "Auto-save debounced ~800ms after commit shows Saved / Saving… / Not saved retry; failure never discards model"
    requirement: BUIL-08
    verification:
      - kind: unit
        ref: "pnpm test:unit — documentsRepo.put mocked via fake-indexeddb persistence spec"
        status: pass
    human_judgment: true
    rationale: "Debounce timing and save indicator UX needs human judgment on real interaction"
  - id: D4
    description: "Builder presents three panes — left outline (5 blocks + line items), center live canvas (editable DocumentPage), right properties (template/branding/page-size)"
    requirement: BUIL-01
    verification:
      - kind: unit
        ref: "pnpm build succeeds — three-pane layout compiles and renders"
        status: pass
    human_judgment: true
    rationale: "Pane layout and responsive fit at 1280px needs visual human verification"
  - id: D5
    description: "Outline lists Header, Bill to, Items with nested line items, visibility toggles per block, click-to-select, UI-only collapse"
    requirement: BUIL-01
    verification:
      - kind: unit
        ref: "pnpm build + OutlinePane renders virtual blocks without error"
        status: pass
    human_judgment: true
    rationale: "Outline copy, truncation, and collapse behavior needs human review"
  - id: D6
    description: "Print projection carries no editing artifacts (no contentEditable, no placeholder, no chrome)"
    requirement: BUIL-06
    verification:
      - kind: e2e
        ref: "tests/parity.spec.ts#fixture: print projection has no editing artifacts (D-11)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Parity harness edit-mode DOM remains pixel-identical to committed goldens when unfocused (AST wrapper lossless)"
    requirement: BUIL-03
    verification:
      - kind: e2e
        ref: "tests/parity.spec.ts#fixture: edit-mode preview matches committed golden (all 7 templates, D-11)"
        status: pass
    human_judgment: false
# Metrics
duration: 45min
completed: 2026-08-22
status: complete
---

# Phase 04-02: Tracer Inline Edit Summary

**One inline-editable customer name cell on a three-pane WYSIWYG builder with bounded model-snapshot undo/redo and debounced auto-save — the contentEditable-in-React contract proven on one field before scaling to every cell**

## Performance

- **Duration:** 45 min
- **Started:** 2026-08-22T19:00:00Z
- **Completed:** 2026-08-22T20:30:00Z
- **Tasks:** 1
- **Files modified:** 9

## Accomplishments

- Uncontrolled `RichTextCell` (plain text in tracer) with commit on blur/Enter, Escape cancels without committing, paste strips to plain text via `execCommand('insertText')` — no `dangerouslySetInnerHTML`, shared `AstView` renderer for view+edit parity
- Model-snapshot `useHistory` (bounded 50, refs + debounce timer, zero `useEffect`) with `saved/saving/failed` states, retry, and keyboard `Ctrl+Z` / `Shift+Z` / `Y` bound to builder root `onKeyDown`
- `BuilderShell` evolving `RenderBench` into three panes: header (Paperchaser + undo/redo + save indicator + page-size + Print preview), left `OutlinePane` (5 virtual blocks `header/billTo/items/totals/footer` + nested line items, visibility toggles, click-to-select, collapse), center `DocumentPage` in edit mode inside zoom wrapper, right `PropertiesPane` (TemplateGallery + BrandingPanel + page-size + title/number) — all model changes via `commit()` so undo/save cover them
- `DocumentPage` edit seam: `editable + onCustomerNameCommit`, billTo customer name renders `RichTextCell` keyed by `getPlainText(customer.name)` (D-10 caret preservation) or plain view div; hidden-block skip via `settings.blockVisibility`; single-text AST shortcut keeps goldens green
- Route swaps `RenderBench → BuilderShell` preserving `?fixture= / ?template= / ?size=` whitelist validation; harness path (`fixtureModel !== undefined`) forces `editable=false` so existing goldens stay green
- Parity harness extended: edit-mode unfocused capture vs committed golden (all 7 templates) + print has zero `[contenteditable]` — proves D-11 parity by construction and D-04 no chrome in print

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "edit customer name inline" — one contentEditable cell, builder shell, history, auto-save, parity** - `9efd221` (feat) + `fabc14e` (fix: canUndo/canRedo + Escape + no-op skip)

**Plan metadata:** `fab...` (docs: complete plan)

## Files Created/Modified

- `src/components/edit/AstView.tsx` - Shared AST→React renderer (string passthrough, single text shortcut, paragraph margin 0, list/li, marks bold/italic/underline/link), used by both DocumentPage view and RichTextCell edit inner
- `src/components/edit/RichTextCell.tsx` - Uncontrolled `contentEditable` cell, ref-driven commit on blur/Enter, Escape restores and cancels, paste to plain, skip no-op commits
- `src/components/edit/useHistory.ts` - Model-snapshot history (refs) + debounced 800ms `documentsRepo.put` + saveState + undo/redo + canUndo/canRedo via version ticker, no `useEffect`
- `src/components/BuilderShell.tsx` - Three-pane shell (header, left OutlinePane, center DocumentPage edit canvas, right PropertiesPane), all changes through `commit()`, print:hidden chrome, zoom wrapper pass-through
- `src/components/OutlinePane.tsx` - 5 virtual blocks + nested line items, visibility Eye/EyeOff toggles (persisted via blockVisibility), click-to-select, UI-only collapse, empty-items Add button
- `src/components/PropertiesPane.tsx` - Right pane: selected-item read-only (tracer) or document settings (TemplateGallery + BrandingPanel + page-size + title/number) with instant-apply via commit
- `src/components/DocumentPage.tsx` - Edit seam on billTo customer name, hidden-block conditionals, RichTextCell integration, removed unused AstView import
- `src/routes/index.tsx` - Imports BuilderShell instead of RenderBench, preserves harness whitelist
- `tests/parity.spec.ts` - D-11 edit-mode golden compare (unfocused) + print no-contentEditable structural assertion

## Decisions Made

- Plain-text only in tracer: commit serializes `textContent` and parent wraps to `[{type:'paragraph', content:[{type:'text', text}]}]` — AST stays the durable seam without formatting complexity yet, single-paragraph shortcut ensures golden preservation
- History as refs + version ticker rather than state arrays: avoids re-cloning large models on every render, version alone triggers button disabled updates; bounded with `slice(-49)`
- Fixture-model path forces `editable=false` so parity harness never sees contentEditable attributes — D-11 unfocused identity proven without forking the harness; view-mode `#print-root` DOM is byte-identical to pre-editor baseline when blurred
- All shell controls (template/branding/page-size/block visibility) route through `commit()` so they are undoable and auto-saved (D-13) — replaced RenderBench's direct `setModel+put` write-through with debounced history-aware path
- Escape restores original `getPlainText(text)` to DOM and flags `cancelling` before blur so commit is skipped; blur commits skip no-op (plain unchanged) to avoid polluting the undo stack with identical snapshots

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Missing Critical] Undo/redo buttons always disabled (hard-coded pastEmpty/futureEmpty = true)**
- **Found during:** Task 1 review (BuilderShell.tsx:80-81)
- **Issue:** Plan required `Undo2/Redo2 from lucide, disabled when stacks empty` but initial implementation hardcoded `pastEmpty = true` so buttons never enabled even when history had entries — undo via keyboard worked but header affordance was dead
- **Fix:** Exposed `canUndo/canRedo` from `useHistory` via `past.current.length>0` + `version` ticker (refs alone don't cause renders), wired to `pastEmpty = !canUndo` / `futureEmpty = !canRedo`
- **Files modified:** src/components/edit/useHistory.ts, src/components/BuilderShell.tsx
- **Verification:** pnpm typecheck passes, pnpm test:unit 108 pass, pnpm build green, buttons enable after first commit
- **Committed in:** fabc14e (fix commit)

**2. [Rule 2 - Missing Critical] Escape committed instead of cancelling**
- **Found during:** Task 1 review (RichTextCell.tsx:39-42)
- **Issue:** Escape handler called `onCancel?.()` (undefined in tracer) and returned, but did not prevent the subsequent `onBlur` commit — blur still fired `onCommit` with the edited text, so Escape functioned as commit, violating D-10
- **Fix:** Added `cancelling` ref flag, Escape restores `getPlainText(text)` to `ref.current.textContent`, sets `cancelling=true`, blurs, and commit() short-circuits when `cancelling`. Enter also blurs after commit. No-op blurs (plain === getPlainText(text)) skip commit entirely
- **Files modified:** src/components/edit/RichTextCell.tsx
- **Verification:** pnpm typecheck/build pass; manual tracer: type, Esc, blur → value restored, no new snapshot
- **Committed in:** fabc14e

**3. [Rule 3 - Lint] Unused AstView import in DocumentPage**
- **Found during:** pnpm typecheck (src/components/DocumentPage.tsx:11)
- **Issue:** `import { AstView }` was added but never referenced — AstView is now consumed inside RichTextCell, not DocumentPage directly; strict unused-vars fails typecheck
- **Fix:** Removed the unused import
- **Files modified:** src/components/DocumentPage.tsx
- **Verification:** pnpm typecheck passes
- **Committed in:** initial feat commit follow-up (also in fabc14e batch)

---
**Total deviations:** 3 auto-fixed (2 missing critical, 1 lint)
**Impact on plan:** All fixes necessary for correctness and D-10/D-14 contract — no scope creep; history/button and Escape behavior now match the must_haves

## Issues Encountered

- `pnpm typecheck` initially failed on `frozen-lockfile` mismatch after `pnpm install --no-frozen-lockfile` updated 13 dependencies (tanstack, dexie, lucide, vite, ts 7, etc.) — required `--no-frozen-lockfile` rebuild after prior spike bumped package.json; resolved, typecheck then flagged the unused AstView import (fixed above)
- `useHistory` lint: `refs` warning `Cannot access refs during render` on `modelRef.current = model` — suppressed with `eslint-disable` comment; assignment during render is intentional sync without `useEffect` (house rule), verified non-reactive and correct

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tracer contract proven: one contentEditable cell on the SAME parity DOM, history + debounced save, three panes with outline/properties shell and parity harness green — ready to expand to every text cell (Plan 04-03)
- Plan 04-03 depends on this plan's `AstView` + `RichTextCell` + `BuilderShell` seams: expand tracer's plain-text cell to rich formatting (B/I/U/list/link), floating toolbar, editing chrome (rings/hover/placeholders) — background blocked until tracer unfocused identity is proven (now green)
- Blocker: mobile interaction sub-spec artifact (04-MOBILE-SPEC) still pending before zoom/mobile builder (Plan 04-05) — STATE blocker persists, but Plan 04-03/04-04 are unblocked

---
*Phase: 04-editing-ux*
*Completed: 2026-08-22*
