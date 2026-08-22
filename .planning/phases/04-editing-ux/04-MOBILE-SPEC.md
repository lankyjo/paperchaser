# 04-Mobile Interaction Sub-Spec (D-19)

Per D-19 — produced IN phase 04-editing-ux before mobile builder implementation. References UI-SPEC §Mobile Interaction Contract and RESEARCH §Mobile interaction spec. STATE.md blocker satisfied by this artifact.

## 1. Screen Inventory

- **Builder mobile view** (`<1024px` single breakpoint D-22): top header (brand, undo/redo icon buttons, preview toggle eye/eye-off, save indicator Saved/Saving…/Not saved — retry), sticky fit-width live preview (DocumentPage at ~55% scale, browser pinch-zoom allowed via `user-scalable=yes`), editor surface below (scrollable list of sections/line items as tappable rows).
- **Bottom sheet: section properties** — Header props (visibility toggle mirror), Bill to props (visibility), Items list (outline + Add item), Totals view (visibility), Footer props (visibility). Sheet height: content-min, snap to 92vh max, internal scroll `overflow-y-auto`.
- **Bottom sheet: line-item details** — title, description, quantity, unit price, discount, tax (read-only, editing inline on canvas per D-02), optional image thumbnail + Add/Replace/Remove image (FileReader → data:-URL, LINE-01, no size limit ponytail). Touch reorder Move up/Down buttons inside sheet (44×44 per UI-SPEC spacing).
- **Bottom sheet: numeric edit** — keyboard-aware contentEditable numeric cell (inputMode=decimal, keystroke filter D-09, Invalid → destructive ring + `Enter a valid number.` popover, commit on blur/Enter, Escape cancels, Tab commits + moves focus). Sheet stays above keyboard via visualViewport resize (CSS viewport units + overflow handling).
- **Bottom sheet: image upload** — file picker `accept="image/*"` → FileReader.readAsDataURL → data:-URL string → commit via `onLineItemChange`. Zod refine rejects external http(s) URLs (T-04-15). Preview thumbnail max-height 60px inline on canvas, max-height 96px in sheet.
- **Toast: save failure** — rendered below sticky header so preview toggle stays reachable (D-20/D-24, UI-SPEC §Mobile Interaction Contract). Retries via `retrySave` (debounced auto-save D-15 ~800ms, failure → toast + Not saved badge, model never discarded D-17).

## 2. Sheet Contents Per Screen

| Screen | Fields | Height | Keyboard |
|--------|--------|--------|----------|
| Section props | Block name, visibility toggle (Eye/EyeOff), selected state | content-min, 92vh cap, internal scroll | N/A |
| Line-item detail | Title (getPlainText), description, qty, unitPrice, tax, discount if present, image field | content-min, 92vh cap, internal scroll | Sheet lifts above keyboard (visualViewport) |
| Numeric edit | focused NumericCell shows raw decimal string (not currency-formatted) → validates → commits via CURRENCY_DECIMALS + roundMinor | inline popover above cell | Keyboard stays visible, sheet scrolls |
| Image upload | Add/Replace/Remove buttons, hidden file input | auto | N/A |

Keyboard-resize behavior: sheet container `max-h-[92vh]` + `overflow-y-auto`; browser viewport resize or `visualViewport` event keeps `BottomSheet` above keyboard. No fixed snap points beyond 92vh (D-21 fallback: Base UI Dialog, not react-spring-bottom-sheet which lacks React 19 peer).

## 3. Navigation

- **Section rows → tap opens sheet**: OutlinePane `onSelect` sets `sheetItemId` on mobile; `BottomSheet` composes `DialogPrimitive.Portal/Backdrop/Popup` (Base UI Dialog wrapper convention from `src/components/ui/dialog.tsx`).
- **Sheet dismiss**: tap backdrop (DialogPrimitive.Backdrop bg-black/50), drag handle pull-down affordance (36×5 rounded muted div centered at top), Escape (Base UI focus trap + Escape), Done/Close button (XIcon + `DialogPrimitive.Close`), `onOpenChange(false)` clears `sheetItemId`.
- **Preview toggle**: header eye button toggles `mobilePreviewVisible`; when hidden, editor surface fills screen; when visible, sticky preview (`position: sticky top-0`, fit-width scale 0.55, box-shadow, allow pinch-zoom) renders DocumentPage view mode (editable=false).

## 4. Touch Adaptations

- All interactive controls: minimum **44×44px** touch target (UI-SPEC §Spacing Scale) — Move up/down buttons `size-7` + padding + `hover:bg-foreground/10` + disabled opacity at bounds.
- **Up/down reorder** (no drag-and-drop on touch per D-23): `handleMoveUp`/`handleMoveDown` swap with adjacent index → `commit` (undo covers, D-13). Disabled at first/last position. Desktop retains `@dnd-kit` `DndContext` + `SortableContext` + `useSortable` (GripVertical 20×20 handle, `PointerSensor` + `KeyboardSensor`, `arrayMove`, `closestCenter`, desktop-only via `hidden lg:flex` handle + `lg:hidden` touch controls).
- Numeric cells: `inputMode=decimal`, keystroke filter (digits, one decimal, one leading minus, controls), Tab commits + focuses next cell via `[data-numeric-cell]` query.
- Rich text cells: tap to focus, `FloatingToolbar` appears 32px above selection (fixed portal, flip below if near top, clamp 16px, print:hidden, link prompt + isSafeHref), execCommand preserves undo buffer.

## 5. State Transitions

- **Preview visible → hidden → visible**: eye toggle flips `mobilePreviewVisible`; no model mutation; CSS sticky preview mounts/unmounts.
- **Sheet open → dismiss**: `sheetItemId` set on select → `BottomSheet open={sheetItemId !== null}` → `onOpenChange(false)` clears `sheetItemId` → focus trap releases to editor surface.
- **Save failure → toast → retry**: `useHistory` debounced `documentsRepo.put` → `saveState='failed'` → header `Not saved — retry` button + mobile banner → `retrySave()` re-attempts.

## 6. Implementation Notes

- Single breakpoint `<1024px` (D-22): `lg:` prefix (Tailwind) — default = mobile stacked, `lg:flex` = three-pane desktop. Zoom controls (`ZoomIn`/`ZoomOut` + percentage) carry `hidden lg:flex` (desktop-only D-24).
- BottomSheet animation: `data-open:slide-in-from-bottom` 300ms ease-out via `tw-animate-css` (mirrors `dialog.tsx` transform-free `inset-0 m-auto` lesson to avoid compositor mispaint).
- Safe-area insets: `pb-[env(safe-area-inset-bottom)]` on sheet container.
- Print projection: zoom wrapper inline `scale` reset via `@media print { [style*='scale'] { transform: none !important; } }` so `#print-root` geometry untouched (parity).
