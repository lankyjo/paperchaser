---
status: complete
phase: 01-foundation-spike
source: [01-VERIFICATION.md]
started: 2026-08-07T18:06:35Z
updated: 2026-08-07T18:14:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Safari 18.2+ paged-media acceptance for the print-CSS PDF path
expected: Open the generated torture-fixture PDF (from the harness page.pdf() output, or save/print from the app) in Safari 18.2+ and verify: (1) repeating table headers across pages, (2) 15mm margins, (3) per-page watermark position. Attach a screenshot to docs/adr/0002-pdf-path.md. All three paged-media behaviors render correctly in Safari 18.2+. Failure of any item flips ADR 0002's decision to @react-pdf/renderer 4.5.1 (the documented fallback).
result: pass

### 2. Golden-baseline visual review of the committed fixture image
expected: Visually review the committed golden baseline tests/fixtures/invoice-torture.preview.png (794x1805, 12.2% non-white): long company name wraps correctly, inline SVG logo renders in the header, DRAFT watermark overlays at top-40% rotated, 18 line items with accented text and wrapping descriptions, totals block at bottom. The fixture renders as a professional A4 invoice layout with no overlapping, clipped, or misplaced elements.
result: pass

### 3. On-screen fixture fidelity (WYSIWYG screen matches print projection)
expected: Eyeball the on-screen rendering at http://localhost:4173/?fixture=invoice-torture (pnpm dev or pnpm preview): WYSIWYG screen shows the same DRAFT overlay, logo, and layout that prints. Screen projection matches the print projection visually.
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
