---
phase: 4
slug: editing-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-10
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 (unit) + @playwright/test 1.62.1 (parity/e2e) |
| **Config file** | vite.config.ts (vitest scoped to src/**/*.test.ts + passWithNoTests) / playwright.config.ts |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:unit && npm run test:parity` (or the repo's CI baseline gates) |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:unit && npm run test:parity`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled during planning) | | | | | | | | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Rich-text AST schema tests (src/document/__tests__/) — stubs for D-06/D-07
- [ ] Dexie v3 migration tests (src/db/__tests__/) — legacy string → AST upgrade (D-29/D-30)
- [ ] Undo/redo + auto-save unit tests (editor model layer)
- [ ] Parity harness extension for edit-mode DOM == view DOM (D-11) — tests/parity.spec.ts

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile bottom-sheet interaction on a real device (touch, safe-area, keyboard) | BUIL-02 | Real-device QA mandatory (STATE.md blocker); touch + sheet behavior not reliably automatable | Open builder on a physical phone, edit a line item in a sheet, verify keyboard resize + safe-area insets |
| Rich-text caret preservation during multi-keystroke editing | BUIL-06, D-10 | Browser caret behavior is device/engine-specific | Type a paragraph in a cell, undo/redo mid-typing, verify caret position |
| Print projection shows zero editing artifacts | BUIL-10, D-11 | Visual parity on real print | Open print preview + print to PDF from a document mid-edit; verify no caret/outline/placeholder |

*Manual verifications complement the automated parity harness; the harness asserts edit-mode DOM == view DOM, the manual steps confirm on real devices.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
