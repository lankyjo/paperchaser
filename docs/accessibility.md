# Accessibility

The app aims for WCAG 2.2 AA. Three checks keep it there:

- `tests/a11y.spec.ts` runs axe (WCAG 2.0 to 2.2, levels A and AA) on the first-run home page, the project list, a project, the desktop and mobile editors, and settings. It runs in CI with the other Playwright tests.
- `tests/keyboard.spec.ts` creates, edits and finalizes a document using only Tab, Shift+Tab, typing and Enter.
- `src/document/__tests__/templateContrast.test.ts` checks that every template's body, muted and label text reaches 4.5:1 against its page color.

## Templates

| Template | Text contrast | Notes |
|---|---|---|
| Blank | AA | |
| Minimal | AA | |
| Noir Ledger | AA | Light text on a dark page; printing keeps the dark page unless you turn off background graphics. |
| Atelier | AA from version 2 | Version 1 labels were 2.6:1. Documents sent with version 1 keep that look. |
| Statement | AA from version 2 | Version 1 labels were 2.6:1. Documents sent with version 1 keep that look. |
| Swiss | AA | |
| Correspondence | AA | |

The DRAFT, PAID and VOID watermark is decorative and hidden from screen readers, so it is exempt from contrast rules. Branding colors you pick yourself are not checked.

## Keyboard

- Every control on the home page, project page and editor can be reached with Tab and Shift+Tab, and activated with Enter or Space.
- Document text is edited in place: Tab into a text field, type, then Tab out to save.
- Sections are moved and hidden with the arrow and eye buttons in the outline, so no dragging is needed.
- Bottom sheets and dialogs keep focus inside them until they close; Escape closes them.
- Workspace panels can be rearranged with a mouse only. The default layout already shows every panel.
