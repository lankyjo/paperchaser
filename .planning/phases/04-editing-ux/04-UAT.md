---
status: diagnosed
phase: 04-editing-ux
source: ["04-01-SUMMARY.md", "04-02-SUMMARY.md", "04-03-SUMMARY.md", "04-04-SUMMARY.md", "04-05-SUMMARY.md"]
started: 2026-08-22T21:15:00Z
updated: 2026-08-22T21:22:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Confirm automated coverage — rich-text AST & migration (04-01)
expected: |
  6 deliverables auto-verified:
  - Rich-text AST schemas validated (src/document/__tests__/richtext.test.ts)
  - Text fields union + lineItem.image + blockVisibility (src/document/__tests__/io.test.ts + typecheck)
  - migrateV2ToV3 idempotent (migrate.test.ts)
  - Dexie v3 upgrade (tests/persistence.spec.ts)
  - Envelope v2 bump (io.test.ts)
  - Fixtures regenerated (build/parity)
  Confirm no visible regression; reply "yes" to pass.
result: pass

### 2. Undo and redo via keyboard
expected: |
  Open the builder (demo doc). Edit customer name on canvas (type, blur to commit). Press Ctrl+Z (or Cmd+Z) — edit reverts. Press Ctrl+Shift+Z or Ctrl+Y — edit reapplies. Undo/redo buttons in header also toggle disabled state (opacity 30% when no history). History is bounded and covers template/branding changes too.
result: pass

### 3. Auto-save indicator
expected: |
  After any commit (text blur, numeric blur, reorder, duplicate/delete), watch header: shows "Saving…" briefly (~800ms) then "Saved". If you block IndexedDB or force failure, it shows "Not saved — retry" without discarding your in-memory edit; clicking retry attempts save again.
result: pass

### 4. Three-pane builder layout (desktop ≥1024px)
expected: |
  At ≥1024px width: left outline (240-320px) shows 5 virtual blocks + line items, center canvas shows DocumentPage with shadow, right properties shows TemplateGallery/BrandingPanel/page-size. At 1280px the 210mm A4 page fits without horizontal scroll. Print preview dialog still opens and shows paginated pages.
result: pass

### 5. Outline pane — select, visibility, collapse
expected: |
  In left outline: click a block (Header/Bill to/etc.) — canvas scrolls toward that section and block highlights (bg-primary/10). Click eye toggle — section hides on canvas and stays hidden after reload (persisted via settings.blockVisibility). On Items, click a line item — selects it (highlight) and shows collapsed description toggle; collapse is UI-only and does not persist across reload.
result: pass

### 6. Floating toolbar — select text shows Bold/Italic/Underline/List/Link
expected: |
  On any text cell (customer name, address, title, description): select a word → floating toolbar appears 32px above selection (flips below if near top, clamped 16px), shows B I U •_list 🔗 buttons. Active format shows accent color. No toolbar appears when no selection. Toolbar is not rendered inside #print-root.
result: issue
reported: "toolbar does not appear on the top of the selected text"
severity: major

### 7. Rich-text formatting — Bold/Italic/Underline/List/Link round-trip
expected: |
  Select text, click B / I / U — formatting toggles and persists after blur→re-enter→blur (domToAst → AstView round-trip). Click list button — selection wraps in bulleted list (•). Click link, enter URL in prompt — link created; unsupported href (javascript:) is rejected. Paste rich HTML (copy from a website) — only plain text is inserted, no tags survive.
result: issue
reported: "i clicked on list after highlighting, Something went wrong! Hide Error Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node. broke the app. same thing when i added the link. both happened on blur. infact all toolbar actions break on blur"
severity: blocker

### 8. All text cells editable inline
expected: |
  Every text cell on canvas is editable in place: customer name, each address line, each line-item title and description. Click to focus, type, press Enter to commit (blurs), press Escape to cancel (restores prior value, no history entry). Cells are keyed by field so caret does not jump on unrelated re-render.
result: pass
reported: "this passed but quite difficult to know app is in edit."
severity: minor

### 9. Editing chrome — hover/focus/placeholder
expected: |
  Hover an editable cell — 1px ring (--ring) outline appears. Focus — 2px --primary ring + 4px white gap. Empty cell shows "Type here" placeholder (centered, muted) that disappears on focus and never appears in print/PDF. No caret, outline, or placeholder appears in print preview or when printing.
result: pass

### 10. Numeric validation — invalid ring + popover
expected: |
  On a numeric cell (Qty or Unit price): clear it and type "abc" → cell shows 1.5px destructive ring + popover "Enter a valid number." and blur does NOT commit. Type "-50" → same error (nonnegative). Press Escape → restores prior value and clears error. Type "19.99" with EUR → commits as €19,99 (or formatted per locale) and converts via CURRENCY_DECIMALS*100; "1000" with JPY → 1000 (0dp). Tab / Shift+Tab commits and moves focus to next/previous numeric cell.
result: issue
reported: "I can only type in numbers. theres literally no button to change currency"
severity: major

### 11. Drag reorder + touch up/down
expected: |
  Desktop (≥1024px): in left outline, grab the GripVertical handle (20×20, cursor-grab) on a line item and drag — row follows, drop reorders both outline and canvas table order (totals recalc). Mobile (<1024px): handle is hidden; instead each row shows Move up/down buttons (44×44, disabled at first/last). Tap up/down — item swaps with adjacent. Totals lineNets update.
result: pass

### 12. Zoom 50%–200% and print ignores zoom
expected: |
  Desktop header: ZoomOut (–) and ZoomIn (+) buttons + percentage readout (e.g., "100%"). Click – repeatedly → disables at 50%; + → disables at 200%; step is 10%. Canvas scales with origin top center, no clipping of page shadow. Open Print preview while at 150% → preview shows page at 100% geometry (15mm padding, identical to no-zoom print) and parity golden matches; print CSS resets transform.
result: pass

### 13. Mobile stacked layout + bottom sheet
expected: |
  Resize to <1024px (or open on phone): layout stacks — top compact header (brand, undo/redo icons, eye preview toggle, Saved indicator), sticky live preview (DocumentPage at ~55% fit-width, pinch-zoom allowed) below header, editor surface below with outline + tappable line-item rows. Tap a line item — bottom sheet slides up from bottom (300ms slide, 36×5 drag handle centered, dim backdrop bg-black/50). Tap backdrop or drag handle or press Escape or tap X — sheet dismisses. Sheet content scrolls internally (92vh max) with safe-area inset, body scroll locked, focus trapped.
result: issue
reported: "mobile view is terrible: screenshot shows duplicated Outline heading, duplicated Add item buttons, document preview hidden behind eye toggle, no document pane visible, mobile drawer shown on desktop width"
severity: major

### 14. Rich-text AST Zod schemas auto-verified
expected: Rich-text AST Zod schemas (richtext.ts) with all node and mark types validated
result: pass
source: automated
coverage_id: 04-01-D1

### 15. Text fields widened + image + blockVisibility auto-verified
expected: Text fields widened to z.union + lineItem.image (data:-URL) + settings.blockVisibility on documentSchema
result: pass
source: automated
coverage_id: 04-01-D2

### 16. migrateV2ToV3 auto-verified
expected: migrateV2ToV3 wraps v2 string fields to single-paragraph ASTs, idempotent
result: pass
source: automated
coverage_id: 04-01-D3

### 17. Dexie v3 upgrade auto-verified
expected: Dexie version(3) upgrade triggers on stored v2 documents, rewrites to v3 shape
result: pass
source: automated
coverage_id: 04-01-D4

### 18. Envelope version bump auto-verified
expected: Envelope version bumped to z.literal(2); v1 imports rejected as invalid_envelope
result: pass
source: automated
coverage_id: 04-01-D5

### 19. Fixtures regenerated auto-verified
expected: Regenerated fixtures with AST-wrapped text fields
result: pass
source: automated
coverage_id: 04-01-D6

### 20. Customer name cell auto-verified
expected: Customer name cell is contentEditable on canvas — click, type, blur commits to model and re-renders
result: pass
source: automated
coverage_id: 04-02-D1

### 21. Print projection no editing artifacts auto-verified
expected: Print projection carries no editing artifacts (no contentEditable, no placeholder, no chrome)
result: pass
source: automated
coverage_id: 04-02-D6

### 22. Parity edit-mode DOM pixel-identical auto-verified
expected: Parity harness edit-mode DOM remains pixel-identical to committed goldens when unfocused (AST wrapper lossless)
result: pass
source: automated
coverage_id: 04-02-D7

### 23. Paste strips to plain text auto-verified
expected: Pasting rich HTML strips to plain text — no tags survive
result: pass
source: automated
coverage_id: 04-03-D3

### 24. domToAst normalization auto-verified
expected: domToAst normalizes browser variants (b/strong→bold, i/em→italic, u→underline, ul>li→list, a→link) and collapses whitespace
result: pass
source: automated
coverage_id: 04-03-D4

### 25. Print projection zero artifacts auto-verified (04-03)
expected: Print projection has zero editing artifacts (no contentEditable in fixture print, no placeholder/chrome in print)
result: pass
source: automated
coverage_id: 04-03-D7

### 26. Numeric cells filter + minor conversion auto-verified
expected: Numeric cells filter keystrokes and convert to minor units on commit via CURRENCY_DECIMALS (EUR 2dp, JPY 0dp)
result: pass
source: automated
coverage_id: 04-04-D1

### 27. Duplicate/delete auto-verified
expected: Duplicate creates new item with unique id after original; Delete shows confirmation dialog (Delete/Cancel) and removes from totals
result: pass
source: automated
coverage_id: 04-04-D4

### 28. Add item + inline cells auto-verified
expected: Add item button appends new empty item; line-item cells editable inline on canvas (RichTextCell + NumericCell)
result: pass
source: automated
coverage_id: 04-04-D5

### 29. Line-item image auto-verified
expected: Line-item image field accepts file input and renders data:-URL thumbnail inline (60px) and in PropertiesPane (96px)
result: pass
source: automated
coverage_id: 04-04-D6

### 30. PropertiesPane selected-item display auto-verified
expected: PropertiesPane shows selected line-item details; defaults to document settings when nothing selected
result: pass
source: automated
coverage_id: 04-04-D7

### 31. Touch reorder 44×44 auto-verified
expected: Touch reorder uses up/down 44×44 buttons; drag-and-drop remains desktop-only
result: pass
source: automated
coverage_id: 04-05-D3

### 32. MOBILE-SPEC artifact auto-verified
expected: 04-MOBILE-SPEC.md exists with screen inventory, sheet contents, keyboard-resize, navigation, touch adaptations, state transitions
result: pass
source: automated
coverage_id: 04-05-D4

### 33. Editing state indicator
expected: App shows clear editing state so user knows when they are editing (not constantly ambiguous)
result: issue
reported: "no editing state?? it is just constantly in editing"
severity: major

### 34. Toolbar on top of highlighted element
expected: Highlighting text shows floating toolbar 32px above the highlighted element, centered, not below or offset
result: issue
reported: "t text formatting bar still not on top of highlighted element — screenshot shows toolbar below Coffee line, not above"
severity: major

### 35. Mobile toolbar visible
expected: On mobile (<1024px), formatting tools are discoverable (floating or footer) when text is selected/focused
result: issue
reported: "still no tool bar for mobile, i dont know what i need to click to display tools. can we have like a mobile footer or domething. (optional)"
severity: major

## Summary

total: 35
passed: 28
issues: 7
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-04-06
  truth: "On any text cell selecting a word shows floating toolbar 32px above selection with B I U list link buttons, accent on active format"
  status: resolved
  reason: "User reported: toolbar does not appear on the top of the selected text"
  severity: major
  test: 6
  root_cause: "FloatingToolbar mounts only when RichTextCell focused, but its selectionchange handler requires document.activeElement === el. On mouse drag selection, activeElement is still the cell but hasSelection checks el.contains(anchorNode) which fails when selection starts outside cell or when toolbar is positioned via stale toolbarRef dimensions (0 width on first render). Additionally, toolbar portal is fixed but parent overflow-auto on canvas can clip getBoundingClientRect to off-screen."
  artifacts:
    - path: "src/components/edit/FloatingToolbar.tsx"
      issue: "selection detection too strict + initial toolbar size 0 causes left clamped to 16px off-selection, single useMountEffect capture of el without re-subscribe on focus changes"
    - path: "src/components/edit/RichTextCell.tsx"
      issue: "renders FloatingToolbar only when focused, so selectionchange before focus=true is missed; no pointerup/mouseup fallback"
  missing:
    - "Relax isFocused to document.activeElement?.contains(el) or el.contains(document.activeElement)"
    - "Add mouseup/keyUp listeners to trigger update after drag end, and defer first position until toolbarRef has width"
    - "Ensure toolbar visible check also allows anchorNode inside execCommand-inserted <b>/<ul>/<a> still considered contained"
  debug_session: ".planning/debug/04-toolbar-position.md"
  resolved_by: "04-06-PLAN.md"
  resolved_at: 2026-08-24
- gap_id: G-04-07
  truth: "Clicking Bold/Italic/Underline toggles formatting via execCommand; List wraps in bulleted list; Link creates/removes validated links and persists after blur"
  status: resolved
  reason: "User reported: i clicked on list after highlighting, Something went wrong! Hide Error Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node. broke the app. same thing when i added the link. both happened on blur. infact all toolbar actions break on blur"
  severity: blocker
  test: 7
  root_cause: "RichTextCell renders <div contentEditable><AstView value={text} /></div> while focused where AstView is React-controlled children. execCommand mutates DOM (inserts <strong>/<ul>/<a>) outside React, then blur handler calls domToAst(ref.current) + onCommit which triggers parent DocumentPage re-render with same key (key based on getPlainText). React diffs the mutated DOM vs expected AstView and attempts removeChild on nodes that execCommand already moved, throwing. Key does not change for formatting-only changes (plain text same), so no remount, diff fails. List and link are worst because they wrap multiple nodes."
  artifacts:
    - path: "src/components/edit/RichTextCell.tsx"
      issue: "uncontrolled contentEditable still renders AstView children while focused; commit on blur triggers React reconcile on execCommand-mutated DOM with stale key"
    - path: "src/components/DocumentPage.tsx"
      issue: "keys use getPlainText(item.title) so formatting-only AST changes keep key stable, preventing remount; paragraph/list structure change requires remount"
    - path: "src/document/richtext.ts"
      issue: "domToAst correctly whitelists b/strong→bold etc but caller mutates DOM before serialization, race with React"
  missing:
    - "Make RichTextCell truly uncontrolled while focused: render empty div and set innerHTML via ref in useMountEffect, or force remount by keying on JSON.stringify(text) not plain text"
    - "Defer onCommit until next tick after execCommand DOM settles, or use requestAnimationFrame before reading domToAst"
    - "Add error boundary fallback so removeChild exception does not crash whole app (ponytail: minimal boundary around DocumentPage)"
  debug_session: ".planning/debug/04-toolbar-removeChild.md"
  resolved_by: "04-06-PLAN.md"
  resolved_at: 2026-08-24
- gap_id: G-04-10
  truth: "Numeric cells filter keystrokes, show destructive ring + popover on invalid, block commit, Escape cancels, Tab moves focus, currency conversion via CURRENCY_DECIMALS with accessible currency switch"
  status: resolved
  reason: "User reported: I can only type in numbers. theres literally no button to change currency"
  severity: major
  test: 10
  root_cause: "Currency is model.currency (EUR/JPY via CURRENCY_DECIMALS) but builder UI exposes only template/branding/page-size in PropertiesPane document settings. No control writes model.currency, so numeric cells correctly filter via CURRENCY_DECIMALS but user cannot switch currency to test JPY 0dp vs EUR 2dp. Numeric validation itself passed (filter works) but discoverability missing."
  artifacts:
    - path: "src/components/PropertiesPane.tsx"
      issue: "document settings card shows TemplateGallery/Branding/PageSize but no currency Select"
    - path: "src/document/money.ts"
      issue: "CURRENCY_DECIMALS registry correct but no UI seam to select currency; conversion via frankfurter.dev suggested by user not integrated"
    - path: "src/components/BuilderShell.tsx"
      issue: "handleTemplateChange/handlePageSizeChange exist but no handleCurrencyChange; commit path ready but not wired"
  missing:
    - "Add currency Select (EUR/JPY) in PropertiesPane document settings, onValueChange commits { ...model, currency: next } via useHistory.commit (undoable)"
    - "Optional ponytail: on currency switch, fetch https://api.frankfurter.app/latest?from=EUR&to=JPY? as user suggested to show converted totals, or just switch CURRENCY_DECIMALS display without re-monetizing stored minors (simpler: keep stored minors, display via new currency decimals, no auto-convert)"
  debug_session: ".planning/debug/04-currency-switch.md"
  resolved_by: "04-07-PLAN.md"
  resolved_at: 2026-08-24
- gap_id: G-04-13
  truth: "Mobile layout <1024px stacks header + sticky fit-width preview + editor surface; bottom sheet slides up with drag handle/backdrop/tap-dismiss/Escape, document pane integrated"
  status: resolved
  reason: "User reported: mobile view is terrible: screenshot shows duplicated Outline heading, duplicated Add item buttons, document preview hidden behind eye toggle, no document pane visible, mobile drawer shown on desktop width. Why use mobile drawer on desktop, why toggle eye to see outline, what about document pane?"
  severity: major
  test: 13
  root_cause: "BuilderShell mobile branch renders OutlinePane plus a manual manual line-item list below ('Document' section with second Add item), duplicating outline. Sticky preview is gated by mobilePreviewVisible (default true but user toggled off, leaving no paper visible) — preview should be always-visible sticky, eye toggle should toggle outline/properties visibility, not preview. BottomSheet is rendered unconditionally (open={sheetItemId !== null}) so desktop ≥1024px also opens sheet on tap, violating D-23 desktop-only DnD. Breakpoint lg (1024px) is correct but phone emulator at 390px correctly shows mobile; complaint about 'mobile drawer on desktop' is due to desktop tap opening bottom sheet instead of right pane."
  artifacts:
    - path: "src/components/BuilderShell.tsx"
      issue: "mobile <1024px section renders OutlinePane plus a manual manual line-item list below ('Document' section with second Add item), duplicating outline; preview conditional on mobilePreviewVisible hides paper; BottomSheet rendered without lg:hidden guard"
    - path: "src/components/BottomSheet.tsx"
      issue: "sheet used for both desktop and mobile selection, should be lg:hidden constrained"
    - path: "src/components/PropertiesPane.tsx"
      issue: "document settings vs selected-item logic duplicated in mobile sheet without preview integration"
  missing:
    - "Remove duplicated manual Document list below OutlinePane in mobile branch; keep single OutlinePane"
    - "Make sticky preview always visible (remove eye toggle gating preview, or change toggle to control outline visibility not preview; keep paper at top)"
    - "Gate BottomSheet to mobile only: const isMobile = window.innerWidth < 1024 or use CSS lg:hidden wrapper; open={sheetItemId !== null && isMobileOr via media query}. Desktop selection should only set selectedItemId for PropertiesPane, not sheet."
    - "Fix duplicated Outline heading (two <h2>Outline</h2> from parent + OutlinePane internal heading)"
  debug_session: ".planning/debug/04-mobile-layout.md"
  resolved_by: "04-07-PLAN.md"
  resolved_at: 2026-08-24
- gap_id: G-04-14
  truth: "App shows clear editing state so user knows when they are editing (not constantly ambiguous)"
  status: failed
  reason: "User reported: no editing state?? it is just constantly in editing"
  severity: major
  test: 33
  root_cause: "D-03 intent is always in edit mode (no view/edit toggle) but badge 'Editing • Click any text to edit' added in 04-07 is subtle and header-only; canvas chrome (1px hover ring, focus ring, placeholder) is transient and not persistent, so user does not perceive editing affordance. No toggle to preview/view mode, no persistent paper ring or background tint."
  artifacts:
    - path: "src/components/BuilderShell.tsx"
      issue: "Editing badge is small, lg-only, and does not explain that editing is always-on per D-03"
    - path: "src/components/edit/RichTextCell.tsx"
      issue: "edit-cell hover/focus rings are transient, empty placeholder only shows when empty, no persistent edit border"
  missing:
    - "Make editing state explicit: persistent subtle paper outline or background tint when editable, plus stronger header badge visible on all breakpoints, and optional view toggle (ponytail: badge is minimal, full toggle add when requested)"
  debug_session: ".planning/debug/04-editing-state.md"
- gap_id: G-04-15
  truth: "Highlighting text shows floating toolbar 32px above the highlighted element, centered, not below or offset"
  status: failed
  reason: "User reported: t text formatting bar still not on top of highlighted element — screenshot shows toolbar below Coffee line, not above"
  severity: major
  test: 34
  root_cause: "FloatingToolbar update calculates top = rect.top - toolbarH -8, but on first open toolbarRef offsetWidth/Height is 0 so effective fallback 220/36 used; after render, rect may be inside scrolled canvas (overflow-auto) where getBoundingClientRect is viewport-relative but sticky header pushes rect, causing top <16 flip to below even when above has space. Fixed positioning without accounting for scroll container offset and header height causes below placement when it should be above. Screenshot shows toolbar centered below line, meaning flip triggered incorrectly."
  artifacts:
    - path: "src/components/edit/FloatingToolbar.tsx"
      issue: "flip threshold top <16 is too aggressive for scrolled canvas; toolbarH fallback 36 may be smaller than actual 44, causing under-estimate; no anchor arrow to indicate target"
    - path: "src/components/DocumentPage.tsx"
      issue: "center column overflow-auto creates separate scroll context; toolbar fixed positioning does not account for container scroll"
  missing:
    - "Increase flip buffer to consider header height (48px) and ensure above placement is preferred when rect.top > toolbarH + 24; only flip if actually clipped by viewport top"
    - "Add 2px arrow or shadow anchor to make above/below unambiguous"
  debug_session: ".planning/debug/04-toolbar-top.md"
- gap_id: G-04-16
  truth: "On mobile (<1024px), formatting tools are discoverable when text is selected/focused"
  status: failed
  reason: "User reported: still no tool bar for mobile, i dont know what i need to click to display tools. can we have like a mobile footer or domething. (optional)"
  severity: major
  test: 35
  root_cause: "FloatingToolbar relies on selectionchange + mouseup to show, but on touch, selection via long-press does not fire mouseup, and toolbar's fixed positioning can be off-screen or behind keyboard. No mobile-specific footer exists, so discovery is low. User requests optional mobile footer with B/I/U/list/link always visible when focused."
  artifacts:
    - path: "src/components/edit/FloatingToolbar.tsx"
      issue: "mobile: no touch-specific handling, toolbar can be hidden behind virtual keyboard or outside viewport"
    - path: "src/components/BuilderShell.tsx"
      issue: "no mobile footer for formatting; BottomSheet is for properties, not formatting"
  missing:
    - "Add mobile footer bar (sticky bottom, safe-area inset, 44px touch targets) that appears when any RichTextCell focused on <1024px, shows B/I/U/list/link + Done, syncs with execCommand state"
    - "Keep floating toolbar as desktop, footer as mobile fallback (ponytail: footer is minimal 5 buttons, hide when not focused)"
  debug_session: ".planning/debug/04-mobile-toolbar.md"

## Deferred Follow-Ups

- test: 8
  idea: "this passed but quite difficult to know app is in edit — consider stronger editing chrome / mode indicator"
  deferred_at: 2026-08-22
