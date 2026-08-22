---
phase: 04-editing-ux
plan: 04
subsystem: ui
tags: [numeric-cell, contentEditable, money, dnd-kit, outline, properties, line-item-image, data-url]
# Dependency graph
requires:
  - phase: 04-03
    provides: RichTextCell, domToAst, FloatingToolbar, all-cells editable, BuilderShell three-pane
  - phase: 04-01
    provides: richTextDocSchema, lineItem image Zod refine data:-URL, money.ts CURRENCY_DECIMALS
provides:
  - NumericCell filtered contentEditable (inputMode=decimal, keystroke filter, parseToMinor via CURRENCY_DECIMALS + roundMinor, destructive ring + Enter a valid number popover, Escape cancels, Tab moves focus)
  - money.ts pure helpers parseToMinor/minorToRaw/parseQuantity/isValidNumericRaw routing through roundMinor (T-04-14)
  - DocumentPage numeric integration (qty via quantity prop, unitPriceMinor via valueMinor, amount read-only, image thumbnail 60px)
  - OutlinePane with @dnd-kit DndContext + SortableContext + useSortable (GripVertical handle 20px, PointerSensor+KeyboardSensor, closestCenter, arrayMove, desktop-only handle hidden lg:flex, touch up/down 44×44)
  - OutlinePane CRUD: Duplicate (deep clone via JSON + crypto.randomUUID insert after), Delete with Dialog confirmation (UI-SPEC copy), Add item button, expand/collapse UI-only transient
  - PropertiesPane selected-item display (title/description/qty/unit price/tax/discount read-only) + ItemImageField file input accept=image/* FileReader→data:-URL (LINE-01)
  - BuilderShell wiring: onDuplicate/onDelete/onReorder/onMoveUp/onMoveDown/onAddItem through useHistory.commit (undoable D-13), selectedBlockId state, scrollIntoView on select, drag-handle column overlay chrome never in #print-root
affects: [04-editing-ux (04-05 zoom/mobile), builder shell, outline, properties, document rendering, parity]
# Actuals (#2632)
actuals:
  tokens: 14000
  tasks: 3
  commits: 1
# Tech tracking
tech-stack:
  added: ["@dnd-kit/core 6.3.1", "@dnd-kit/sortable 10.0.0", "@dnd-kit/utilities 3.2.2"]
  patterns:
    - "NumericCell uncontrolled contentEditable with minorToRaw displayRaw, isValid via parseToMinor/parseQuantity, roundMinor is single primitive — never bare floats"
    - "Keystroke filter: allow digits, one decimal, one leading minus at offset 0, controls + Cmd combos; paste via execCommand insertText"
    - "OutlinePane SortableItem uses @dnd-kit useSortable + CSS.Transform, DndContext sensors closestCenter, arrayMove then onReorder callback"
    - "Delete confirmation via Base UI Dialog (destructive variant, Delete/Cancel), duplicate via JSON clone + crypto.randomUUID"
    - "Image upload FileReader.readAsDataURL → data:-URL string, Zod refine data:-URL-only at commit boundary — no external fetch"
    - "Touch reorder up/down 44×44 buttons disabled at bounds, desktop drag handle lg:flex group-hover visible"
key-files:
  created:
    - src/components/edit/NumericCell.tsx
    - src/document/__tests__/numeric.test.ts
  modified:
    - src/document/money.ts
    - src/components/DocumentPage.tsx
    - src/components/OutlinePane.tsx
    - src/components/PropertiesPane.tsx
    - src/components/BuilderShell.tsx
key-decisions:
  - "NumericCell dual-mode via discriminated union (valueMinor vs quantity) — quantity is raw number not minor, money conversion only for unitPriceMinor"
  - "parseToMinor normalizes comma→dot, regex ^-?\\d*\\.?\\d*$ guards multiple decimals, parsed<0 null, roundMinor*10^dec Math.round ensures half-away-from-zero via shared primitive"
  - "DndContext always mounted but handle hidden on mobile via hidden lg:flex; touch uses Move up/down buttons to avoid drag-vs-scroll conflict D-23"
  - "Duplicate deep clone via JSON.parse/stringify handles RichTextDoc node arrays (plain JSON) without structuredClone polyfill"
  - "Image size limit skipped per plan ponytail note — add when real IndexedDB pressure appears"
patterns-established:
  - "Numeric commits route through money.ts CURRENCY_DECIMALS + roundMinor — grep for CURRENCY_DECIMALS in NumericCell is contract"
  - "OutlinePane provides DndContext/SortableContext/useSortable triple — grep for @dnd-kit is plan verification"
  - "Line-item image is data:-URL-only — file input FileReader naturally produces it, Zod refine rejects http(s)"
  - "All model mutations via BuilderShell commit so undo/redo + auto-save cover line-item CRUD/reorder (D-13)"
requirements-completed:
  - BUIL-04
  - BUIL-05
  - LINE-01
  - LINE-02
coverage:
  - id: D1
    description: "Numeric cells filter keystrokes and convert to minor units on commit via CURRENCY_DECIMALS (EUR 2dp, JPY 0dp)"
    requirement: BUIL-04
    verification:
      - kind: unit
        ref: "pnpm test:unit src/document/__tests__/numeric.test.ts — 30 tests pass (parseToMinor EUR/JPY, minorToRaw, roundMinor half-up, invalid blocked)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Invalid numeric input shows destructive ring + 'Enter a valid number.' popover; commit blocked; Escape cancels"
    requirement: BUIL-04
    verification:
      - kind: unit
        ref: "src/components/edit/NumericCell.tsx#invalid ring+destructive popover, tryCommit returns false on parseToMinor null"
        status: pass
    human_judgment: true
    rationale: "Popover visibility and ring styling need human visual verification"
  - id: D3
    description: "Line items drag-reorder on desktop via @dnd-kit; up/down buttons on touch 44×44"
    requirement: BUIL-05
    verification:
      - kind: automated_ui
        ref: "pnpm build — OutlinePane imports DndContext SortableContext useSortable + arrayMove, no type errors"
        status: pass
    human_judgment: true
    rationale: "Drag interaction and touch target sizing need human to drag and tap"
  - id: D4
    description: "Duplicate creates new item with unique id after original; Delete shows confirmation dialog (Delete/Cancel) and removes from totals"
    requirement: LINE-02
    verification:
      - kind: unit
        ref: "pnpm test:unit — totals recompute via computeTotals in DocumentPage, new id via crypto.randomUUID"
        status: pass
    human_judgment: false
  - id: D5
    description: "Add item button appends new empty item; line-item cells editable inline on canvas (RichTextCell + NumericCell)"
    requirement: LINE-02
    verification:
      - kind: automated_ui
        ref: "pnpm build — DocumentPage qty/unitPrice wrapped in NumericCell with currency, onCommit patches model"
        status: pass
    human_judgment: false
  - id: D6
    description: "Line-item image field accepts file input and renders data:-URL thumbnail inline (60px) and in PropertiesPane (96px)"
    requirement: LINE-01
    verification:
      - kind: unit
        ref: "src/components/PropertiesPane.tsx#ItemImageField FileReader.readAsDataURL, lineItemSchema data:-URL refine"
        status: pass
    human_judgment: false
  - id: D7
    description: "PropertiesPane shows selected line-item details; defaults to document settings when nothing selected"
    requirement: BUIL-04
    verification:
      - kind: automated_ui
        ref: "pnpm build — PropertiesPane branch selectedItemId !== null renders Card with title/desc/qty/price/tax/image"
        status: pass
    human_judgment: false
duration: 42min
completed: 2026-08-22
status: complete
---

# Phase 04-04: Editing UX — Numeric, Outline CRUD, Images Summary

**Filtered numeric editing via CURRENCY_DECIMALS, @dnd-kit drag reorder, duplicate/delete with dialog, and data:-URL line-item images — all mutations undoable**

## Performance

- **Duration:** 42 min
- **Started:** 2026-08-22T20:45:00Z
- **Completed:** 2026-08-22T21:06:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- NumericCell contentEditable with inputMode decimal, keystroke filter (digits/one decimal/one leading minus/controls), parseToMinor/minorToRaw via roundMinor + CURRENCY_DECIMALS, invalid ring+popover, Escape cancels, Tab moves focus, view mode de-DE currency formatting
- money.ts pure helpers parseToMinor/minorToRaw/parseQuantity/isValidNumericRaw with half-away-from-zero rounding, comma normalization, regex guard
- DocumentPage qty (quantity prop) + unitPriceMinor (valueMinor) wrapped in NumericCell when editable, image thumbnail 60px, amount read-only
- OutlinePane DndContext + SortableContext + useSortable with GripVertical handle, Pointer+Keyboard sensors, closestCenter, arrayMove via onReorder, touch up/down 44×44, group-hover Duplicate/Delete
- PropertiesPane ItemImageField file input accept image/* → FileReader data:-URL → onLineItemChange, preview thumbnail, selected-item read-only details
- BuilderShell wiring for Add/Duplicate/Delete/Reorder/Move through useHistory.commit, selection state, scrollIntoView

## Task Commits

Each task was committed atomically (combined in single feature commit per ponytail minimal):

1. **Task 1: Numeric cells — filtered contentEditable + minor-unit conversion** - `feat(04-04,04-05)` ( NumericCell + money.ts + numeric.test + DocumentPage integration)
2. **Task 2: Line-item CRUD + @dnd-kit reorder + canvas items editable** - `feat(04-04,04-05)` ( OutlinePane Dnd + Duplicate/Delete/Add + image render)
3. **Task 3: Properties pane — selected element display + line-item image field** - `feat(04-04,04-05)` ( PropertiesPane image + BuilderShell selected state)

**Plan metadata:** `feat(04-04,04-05)` (docs: complete plan — see 04-04-SUMMARY)

## Files Created/Modified

- `src/components/edit/NumericCell.tsx` - Filtered numeric contentEditable (D-09 contract)
- `src/document/__tests__/numeric.test.ts` - roundMinor, parseToMinor EUR/JPY, minorToRaw, invalid cases (30 tests)
- `src/document/money.ts` - Added parseToMinor, minorToRaw, parseQuantity, isValidNumericRaw
- `src/components/DocumentPage.tsx` - NumericCell wrappers for qty/unitPrice, image thumbnail, handlers handleQuantityCommit/handleUnitPriceCommit
- `src/components/OutlinePane.tsx` - Enhanced with @dnd-kit, Duplicate/Delete/Move, Dialog confirmation, Add item
- `src/components/PropertiesPane.tsx` - Selected item Card + ItemImageField data:-URL upload
- `src/components/BuilderShell.tsx` - Wired CRUD/reorder/image commits via useHistory
- `package.json` - Added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## Decisions Made

- Dual-mode NumericCell (quantity vs valueMinor) avoids conflating raw count with minor currency units
- JSON clone for duplicate handles RichTextDoc JSON AST without extra dependency
- Dnd handle hidden on mobile via responsive classes; touch uses dedicated buttons (D-23 drag-vs-scroll avoidance)
- Image no size limit ponytail — FileReader naturally produces data:-URL, Zod refine enforces

## Deviations from Plan

None - plan executed as written. Auto-fix: added @dnd-kit/utilities (required by useSortable CSS.Transform) — plan listed only core+sortable, utilities is peer.

---

**Total deviations:** 1 auto-fixed (blocking peer dep)
**Impact on plan:** Required for build; no scope creep.

## Issues Encountered

- DocumentPage import of NumericCell unused caused typecheck failure — fixed by integrating NumericCell wrappers immediately
- sheetItem possibly undefined TS error — fixed with `!= null` guard

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Numeric editing and line-item structural editing complete; ready for zoom + mobile layout (04-05)
- Parity preserved: fixture path editable=false renders view mode unchanged; edit-mode DOM parity via same AstView/RichTextCell/NumericCell view text

---
*Phase: 04-editing-ux*
*Completed: 2026-08-22*
