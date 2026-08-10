# Phase 4: Editing UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-10
**Phase:** 4-Editing UX
**Areas discussed:** Inline editing mechanics, Undo/redo & auto-save, Mobile interaction spec, Section model & outline

---

## Inline editing mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay inputs | Transparent input over clicked text; zero parity risk | |
| contentEditable in DOM | True in-place editing; React reconciliation risk | ✓ |
| Text inline, numbers in panel | Numbers via right pane | |
| Everything inline | All fields editable on canvas | ✓ |
| Always-editable canvas | No view/edit toggle | ✓ |
| Edit/preview toggle | Cleaner preview, another mode | |
| Overlay chrome, never in #print-root | Editing chrome in builder shell only | ✓ |
| Flag-gated chrome inside DocumentPage | Branching in parity component | |
| Text-only contentEditable | Plain text cells | |
| Rich text editing | Bold/italic/underline/lists/links | ✓ |
| Inline numeric editing | Filtered contentEditable for numbers | |
| Inline with popover fallback | Popover for edge cases | ✓ |
| Blur/Enter commit | Commit on blur + Enter, Escape cancels | ✓ |
| Live on every keystroke | Fights React render loop | |
| One DOM, edit attrs in place | Same cells, same tree, parity harness on edit DOM | ✓ |
| Separate editable clone | Drift risk, violates one-truth | |
| JSON AST in model | Tiptap/Lexical-style AST, Zod-validated | ✓ |
| Sanitized HTML strings | XSS surface, parsing risk | |
| Body text only | Only descriptions rich | |
| Every text node | All names/addresses/labels rich | ✓ |
| Minimal formatting set | Bold, italic, underline, bulleted list, link | ✓ |
| Full formatting palette | More surface, more goldens | |

**User's choice:** contentEditable in DOM; everything inline; always-editable; overlay chrome; rich text; inline-with-popover for numbers; blur/Enter commit; one-DOM parity guard; JSON AST; every text node; minimal formatting set.
**Notes:** User explicitly chose the riskier true-WYSIWYG paths. Rich text for every text node forces a Dexie version(3) migration — confirmed intended (D-29).

---

## Undo/redo & auto-save

| Option | Description | Selected |
|--------|-------------|----------|
| Model snapshots | Push whole model onto stack per commit | ✓ |
| Command pattern | {apply, undo} ops per edit type | |
| All model changes | Content + structural + styling undoable | ✓ |
| Content-only undo | Template/branding excluded | |
| Bounded history | ~50 snapshots | ✓ |
| Unbounded | Full session history | |
| Debounced write | ~800ms after last change | ✓ |
| Write-through every change | Current bench behavior, more churn | |
| Saved/Saving indicator | Header shows save state | ✓ |
| Silent autosave | No indicator | |
| Toast + unsaved badge | On Dexie failure, never lose in-memory model | ✓ |
| Silent best-effort | Failures swallowed | |
| Native shortcuts | Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z | ✓ |
| Shortcuts + toolbar buttons | On-screen undo/redo too | |

**User's choice:** Model snapshots; all model changes undoable; bounded history; debounced write; indicator; toast + unsaved badge; native shortcuts.
**Notes:** Debounced write replaces the current write-through in RenderBench.tsx.

---

## Mobile interaction spec

| Option | Description | Selected |
|--------|-------------|----------|
| Produce spec in Phase 4 | 04-MOBILE-SPEC.md satisfies STATE.md blocker | ✓ |
| Defer mobile to later phase | Keeps phase smaller, BUIL-02 stays open | |
| Top preview, editor below | Header + sticky preview on top + editor below | ✓ |
| Bottom sticky preview | Eats sheet space | |
| Sheet=props, Fullscreen=line item, Drawer=outline | PRD 6.2 mapping | |
| react-spring-bottom-sheet for all sheets | User-specified library | ✓ |
| Up/down controls on touch | Avoids drag-vs-scroll conflict | ✓ |
| Touch drag-and-drop too | Scroll conflicts, accidental reorders | |
| Fit-width on mobile | Zoom is desktop-only | ✓ |
| Zoom controls on mobile too | | |
| 04-MOBILE-SPEC.md in phase dir | Design doc mirroring 03-UI-SPEC.md | ✓ |
| CONTEXT.md only | No separate spec | |
| Single breakpoint | <1024px mobile, >=1024 three-pane | ✓ |
| Three tiers | Mobile/tablet/desktop | |

**User's choice:** Produce spec in Phase 4; top preview; react-spring-bottom-sheet for all sheet surfaces; single breakpoint; up/down controls on touch; fit-width preview; spec at 04-MOBILE-SPEC.md.
**Notes:** User-provided library URL — researcher must verify React 19/Base UI compatibility.

---

## Section model & outline

| Option | Description | Selected |
|--------|-------------|----------|
| Implicit sections, no model change | Outline lists fixed render blocks virtually | ✓ |
| Explicit sections in model | Schema change + migration + renderer rewrite | |
| Reorder items only; blocks get visibility | Blocks show/hide, not reorder | ✓ |
| Reorder blocks too | Totals before items, etc. | |
| Blocks + line items | Outline shows both, drag reorder for items | ✓ |
| Blocks only | Line items only in right pane | |
| UI-only collapse | Transient builder state, not stored | ✓ |
| Persisted collapse | Schema change + migration | |
| Accept: rich text forces v(3) | Confirmed migration intended | ✓ |
| Plain strings for structural fields | Reduced migration surface | |
| Persisted per-document | Block visibility stored, survives reload/print | ✓ |
| UI-only toggles | Blocks always render in print | |

**User's choice:** Implicit sections; reorder items only, blocks get visibility; outline shows blocks + line items; UI-only collapse; accept rich text v(3); persisted block visibility.
**Notes:** Rich-text/version(3) interplay explicitly confirmed by user (D-29).

---

## the agent's Discretion

- **Canvas zoom implementation (BUIL-09)** — mechanism left to planner (CSS transform scale is the obvious fit; screen-only).
- **Right-pane contents** — everything is edited inline (D-02), so the right pane holds selected-element properties + document settings; exact arrangement is planner discretion.
- **LINE-01 optional line-item image** — current schema lacks it; folds into the v(3) migration at researcher/planner discretion.

## Deferred Ideas

- **Explicit section model** — rejected this phase (D-25); revisit only for arbitrary block composition.
- **Rich text beyond minimal formatting set** — AST leaves room, but v1 ships minimal set (D-08).
