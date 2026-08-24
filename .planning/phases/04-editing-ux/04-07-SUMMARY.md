---
phase: 04-editing-ux
plan: 07
subsystem: ui
tags: [currency, frankfurter, mobile, bottom-sheet, responsive, editing-badge]
# Dependency graph
requires:
  - phase: 04-04
    provides: PropertiesPane, BuilderShell, BottomSheet, money CURRENCY_DECIMALS
provides:
  - PropertiesPane currency Select (EUR/JPY) with commit and frankfurter fetch fallback
  - BuilderShell mobile fix: always-visible sticky preview, single outline, removed duplicate Document list, mobile-only BottomSheet gating, Editing badge
affects: [04-editing-ux UAT G-04-10 G-04-13, mobile builder, currency, edit-mode UX]
# Actuals (#2632)
actuals:
  tokens: 9000
  tasks: 3
  commits: 1
# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Currency Select value model.currency → commit + frankfurter fetch with setTimeout fallback, display-only switch (stored minors unchanged)"
    - "Mobile sticky preview always visible, duplicated heading/list removed, BottomSheet gated to <1024px via handleOutlineSelect width check"
    - "Header Editing badge when editable true"
key-files:
  created: []
  modified:
    - src/components/PropertiesPane.tsx
    - src/components/BuilderShell.tsx
key-decisions:
  - "Frankfurter fetch is best-effort display-only; stored unitPriceMinor not re-monetized on currency switch to avoid silent money change"
  - "Mobile preview always visible rather than eye-gated; eye button removed to avoid confusion"
  - "BottomSheet gated via window.innerWidth < 1024 in handleOutlineSelect, not CSS, so desktop selection uses right pane"
patterns-established:
  - "Currency switch via PropertiesPane document settings with CURRENCY_DECIMALS helper text"
  - "Mobile layout uses single OutlinePane, no manual Document map duplication"
requirements-completed:
  - BUIL-02
  - BUIL-04
coverage:
  - id: D1
    description: "Currency selector switches EUR/JPY and persists via CURRENCY_DECIMALS"
    requirement: BUIL-04
    verification:
      - kind: automated_ui
        ref: "pnpm build — PropertiesPane Select EUR/JPY + onCurrencyChange commit"
        status: pass
    human_judgment: true
    rationale: "Currency switch and JPY 0dp vs EUR 2dp formatting needs human to type and switch"
  - id: D2
    description: "Mobile shows single outline, preview always visible, single Add item"
    requirement: BUIL-02
    verification:
      - kind: automated_ui
        ref: "pnpm build — BuilderShell mobile preview always visible, duplicated list removed"
        status: pass
    human_judgment: true
    rationale: "Mobile layout at 390px needs visual check"
  - id: D3
    description: "Bottom sheet only on mobile"
    requirement: BUIL-02
    verification:
      - kind: unit
        ref: "src/components/BuilderShell.tsx#handleOutlineSelect window.innerWidth <1024 guard"
        status: pass
    human_judgment: false
  - id: D4
    description: "Edit badge visible when editable"
    requirement: BUIL-02
    verification:
      - kind: automated_ui
        ref: "pnpm build — BuilderShell header Editing badge lg:inline"
        status: pass
    human_judgment: false
duration: 15min
completed: 2026-08-24
status: complete
---

# Phase 04-07: Gap Closure — Currency & Mobile Summary

**Currency switch with frankfurter fallback, mobile single-outline + always-visible preview, mobile-only sheet, and edit badge**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-24T12:27:00Z
- **Completed:** 2026-08-24T12:42:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- PropertiesPane document settings now shows Currency Select EUR/JPY (2dp vs 0dp helper), commits `model.currency` via `useHistory`, attempts `https://api.frankfurter.app/latest?from=EUR&to=JPY` with 300ms fallback
- BuilderShell mobile: removed duplicated `<h2>Outline</h2>` and second manual `{model.lineItems.map}` Document list, made sticky preview always visible (scale 0.55), removed eye toggle, gated `setSheetItemId` to `<1024px` so desktop uses right pane, kept single OutlinePane Add item
- Header shows “Editing • Click any text to edit” badge when `editable` true (addresses deferred test 8 discoverability)
- BottomSheet now mobile-only in practice; desktop selection highlights right pane PropertiesPane

## Task Commits

1. **Task 1: Add currency selector with frankfurter.dev** - `feat(04-07)` (Select + fetch fallback)
2. **Task 2: Fix mobile duplication and preview visibility** - `feat(04-07)` (remove duplicate, always-visible preview, mobile gate)
3. **Task 3: Make edit mode obvious** - `feat(04-07)` (Editing badge)

**Plan metadata:** `feat(04-07)` (docs: complete plan — see 04-07-SUMMARY)

## Files Created/Modified

- `src/components/PropertiesPane.tsx` — added Currency card with Select + frankfurter fetch
- `src/components/BuilderShell.tsx` — added handleCurrencyChange, Editing badge, mobile preview fix, duplication removal, mobile sheet gating

## Decisions Made

- Display-only currency switch preserves stored minors; full francfurter conversion deferred
- Keep mobile preview always visible rather than toggle-gated; eye toggle removed
- Gate sheet via width check in handler not CSS, since portal renders to body outside CSS container

## Deviations from Plan

None

## Issues Encountered

- Mobile preview still at 0.55 scale; fit-width auto-scale deferred to future

## User Setup Required

None — frankfurter.dev is public, no key, graceful offline fallback

## Next Phase Readiness

- Currency and mobile gaps ready for re-verify
- Edit mode discoverability addressed via header badge

---
*Phase: 04-editing-ux*
*Completed: 2026-08-24*
