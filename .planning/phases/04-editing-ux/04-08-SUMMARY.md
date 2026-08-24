---
phase: 04-editing-ux
plan: 08
subsystem: ui
tags: [editing-state, floating-toolbar, mobile-footer, responsive]
# Dependency graph
requires:
  - phase: 04-06
    provides: FloatingToolbar contains check + deferred commit + JSON keys
  - phase: 04-07
    provides: Currency Select, mobile single-outline + always preview
provides:
  - BuilderShell persistent Editing badge (all breakpoints, pulse dot) + canvas ring when editable
  - FloatingToolbar header-aware flip (48px header threshold) with arrow anchor, prefers above
  - MobileFormattingFooter sticky bottom bar <1024px with B/I/U/list/link + Done, 44px, safe-area, lg:hidden
affects: [04-editing-ux UAT G-04-14/15/16, editing UX, mobile]
# Actuals (#2632)
actuals:
  tokens: 7000
  tasks: 3
  commits: 1
# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Editing badge inline-flex with animate-pulse dot visible on all breakpoints, not lg-only"
    - "FloatingToolbar flipped state with arrow, top <56 triggers below (header 48+8), 12px gap"
    - "MobileFormattingFooter focusin/selectionchange driven, fixed bottom, print:hidden lg:hidden, 44px touch"
key-files:
  created:
    - src/components/edit/MobileFormattingFooter.tsx
  modified:
    - src/components/BuilderShell.tsx
    - src/components/edit/FloatingToolbar.tsx
key-decisions:
  - "Badge always visible because D-03 always-edit is confusing without persistent indicator"
  - "Arrow makes above/below unambiguous; header-aware threshold prevents false flip in scrolled canvas"
  - "Footer is fallback for touch, not replacement — floating toolbar still primary on desktop and touch long-press"
patterns-established:
  - "Mobile footer appears when any contentEditable focused on <1024px, Done blurs to dismiss"
requirements-completed:
  - BUIL-03
  - BUIL-06
  - BUIL-02
coverage:
  - id: D1
    description: "Editing badge visible on all breakpoints and canvas shows persistent ring"
    requirement: BUIL-03
    verification:
      - kind: automated_ui
        ref: "pnpm build — BuilderShell inline-flex badge + cn ring-1 ring-primary/15"
        status: pass
    human_judgment: false
  - id: D2
    description: "Toolbar appears above selection with arrow, flips below only when truly clipped"
    requirement: BUIL-03
    verification:
      - kind: automated_ui
        ref: "pnpm build — FloatingToolbar flipped state + header 56 threshold"
        status: pass
    human_judgment: true
    rationale: "Above vs below positioning needs human to select near top and middle"
  - id: D3
    description: "Mobile footer with B/I/U/list/link appears on <1024px when focused, Done dismisses"
    requirement: BUIL-02
    verification:
      - kind: automated_ui
        ref: "pnpm build — MobileFormattingFooter lg:hidden + focusin visible"
        status: pass
    human_judgment: true
    rationale: "Touch discovery and 44px targets need human on real device"
duration: 12min
completed: 2026-08-24
status: complete
---

# Phase 04-08: Polish — Editing State, Toolbar Top, Mobile Footer Summary

**Persistent Editing badge, header-aware toolbar above with arrow, and mobile sticky formatting footer**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-24T13:00:00Z
- **Completed:** 2026-08-24T13:12:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- BuilderShell header Editing badge now `inline-flex` with pulse dot visible on all breakpoints (was `hidden lg:inline`), canvas zoom wrapper adds `ring-1 ring-primary/15` when editable (print:hidden)
- FloatingToolbar prefers above (`rect.top - toolbarH -12`) and only flips below if `top <56` (48 header +8), tracks `flipped` state, renders arrow triangle centered at toolbar edge
- MobileFormattingFooter created: fixed bottom, `lg:hidden`, `pb-[env(safe-area-inset-bottom)]`, 44px buttons, appears when any `[contenteditable=true]` focused on <1024px, B/I/U/list/link via execCommand + Done blur, integrated into BuilderShell after BottomSheet

## Task Commits

1. **Task 1: Make editing state obvious** - `feat(04-08)` (badge + ring)
2. **Task 2: Ensure toolbar is on top** - `feat(04-08)` (flip + arrow)
3. **Task 3: Add mobile footer** - `feat(04-08)` (new component + integration)

**Plan metadata:** `feat(04-08)` (docs: complete plan — see 04-08-SUMMARY)

## Files Created/Modified

- `src/components/edit/MobileFormattingFooter.tsx` — new mobile footer (focus-driven, safe-area)
- `src/components/BuilderShell.tsx` — badge visible, canvas ring, MobileFormattingFooter import+render
- `src/components/edit/FloatingToolbar.tsx` — header-aware flip + arrow + flipped state

## Decisions Made

- Keep D-03 always-edit but make it obvious via badge+ring instead of adding view/edit toggle
- Footer is mobile-only fallback, not desktop replacement

## Deviations from Plan

None

## Issues Encountered

None

## User Setup Required

None

## Next Phase Readiness

- G-04-14/15/16 ready for re-verify
- Mobile discovery now has two paths: floating (desktop) + footer (touch)

---
*Phase: 04-editing-ux*
*Completed: 2026-08-24*
