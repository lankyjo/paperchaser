---
phase: 2
slug: domain-core-persistence
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 (unit, node env) + @playwright/test 1.62.1 (persistence e2e) + existing parity harness |
| **Config file** | none for Vitest — reads `vite.config.ts` by default; `playwright.config.ts` unchanged |
| **Quick run command** | `pnpm test:unit` (new script: `vitest run`) |
| **Full suite command** | `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec vitest run <touched test file>` + `pnpm typecheck`
- **After every plan wave:** Run `pnpm lint && pnpm typecheck && pnpm test:unit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-01 | 01 | 1 | LINE-03 | — | Totals by one engine; per-line rounding; both discount levels; shipping/fees; EUR 2dp + JPY 0dp; 0.1 qty; .5 ties; `Σ lineNets == subtotal`; `tax == round(roundedNet × rate)` | unit | `pnpm exec vitest run src/document/__tests__/totals.test.ts` | ❌ Wave 0 | ⬜ pending |
| TBD-02 | 01 | 1 | LINE-03 | — | Renderer consumes engine (no second `computeTotals`); watermark derived from status | unit/integration | `pnpm typecheck` + `pnpm test` (parity green after `DocumentPage.tsx` swap) | ❌ Wave 0 (edit) | ⬜ pending |
| TBD-03 | 02 | 1 | STOR-01 | — | Repos persist via Dexie (fake-indexeddb): put/get/delete round-trips; singleton company; KV preferences | unit | `pnpm exec vitest run src/db/__tests__/repos.test.ts` | ❌ Wave 0 | ⬜ pending |
| TBD-04 | 02 | 1 | STOR-01/02 | — | Data survives a full page reload in a real browser | e2e (Playwright) | `pnpm exec playwright test tests/persistence.spec.ts` | ❌ Wave 0 | ⬜ pending |
| TBD-05 | 03 | 1 | STOR-03 | — | `exportDocument` emits envelope shape; `parseDocument(exportDocument(doc))` deep-equals `doc` for all fixtures (lossless) | unit | `pnpm exec vitest run src/document/__tests__/io.test.ts` | ❌ Wave 0 | ⬜ pending |
| TBD-06 | 03 | 1 | STOR-04 | — | Boundary rejects malformed JSON (`invalid_json`), wrong format/version (`invalid_envelope`), missing/typo'd fields (`schema_mismatch`); unknown extras stripped not rejected | unit | same `io.test.ts` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Framework install: `pnpm add zod && pnpm add -D vitest fake-indexeddb`
- [ ] `package.json`: add `"test:unit": "vitest run"` script (keep `test` = parity)
- [ ] `src/document/__tests__/totals.test.ts` — LINE-03 unit fixtures
- [ ] `src/document/__tests__/io.test.ts` — STOR-03/04 envelope + boundary + round-trip fixtures
- [ ] `src/db/__tests__/repos.test.ts` — STOR-01/02 repo CRUD on fake-indexeddb
- [ ] `tests/persistence.spec.ts` — STOR-01/02 reload-survival (UMD Dexie)
- [ ] `.github/workflows/ci.yml` — add `pnpm test:unit` gate

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | — | All phase behaviors have automated verification. | — |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
