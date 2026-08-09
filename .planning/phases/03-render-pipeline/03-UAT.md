---
status: complete
phase: 03-render-pipeline
source: [03-VERIFICATION.md]
started: 2026-08-09T11:05:00Z
updated: 2026-08-09T12:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Click through all 7 template gallery cards in the bench rail
expected: Each template re-renders instantly with a visually distinct identity (colors/fonts/borders/spacing); document content (items, totals, customer) is identical across switches; page structure never changes (same sections, same order)
result: pass

### 2. Branding WYSIWYG flow in the app
expected: Logo appears in the header; document recolors instantly; re-renders instantly per control; 'PAID' overlay renders in the accent color; reload the page → ALL branding persists per-document (D-01); uploading a 5 MB file shows the inline 'Couldn't load that file…' error with no state change; Remove logo → confirm dialog → logo gone
result: pass

### 3. Watermark overrides
expected: Draft forces 'DRAFT' overlay regardless of status (edge-11); Paid forces 'PAID' regardless of status (edge-12); 'auto' on a paid doc renders no watermark (documented DRAFT-only deriveWatermark divergence)
result: pass

### 4. Page sizes in the browser
expected: Canvas page block narrows to 148mm (A5) / widens to 297mm (A3); Ctrl+P shows the paper size in the browser print dialog; A4 remains the default on load
result: pass

### 5. Print preview dialog UX
expected: Torture: 2 page blocks, 'Page 1 of 2' / 'Page 2 of 2', table header visible at top of page 2, content identical to the canvas; 'Print' opens the browser print dialog; Close works. Simple: exactly 1 block
result: pass

### 6. Empty-store load
expected: An English Minimal invoice renders on the canvas; hard refresh → the SAME document persists (seeded once, idempotent); /?fixture=invoice-torture still renders the torture fixture
result: pass

### 7. Unknown query params degrade safely
expected: /?template=unknown and /?size=unknown both render the minimal template / A4 page (resolver defaults), never an error page, never reflected raw values
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
